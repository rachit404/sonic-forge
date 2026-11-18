"""AI generation endpoints."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.ai.registry import ProviderRegistry, setup_providers
from sonicforge.database import get_session
from sonicforge.models.generation_job import GenerationJobModel
from sonicforge.schemas.generation import (
    CreateJobRequest,
    GenerationJobSchema,
    ProviderCapabilitiesSchema,
    ProviderSchema,
)
from sonicforge.services.audio_service import AudioService

router = APIRouter()
logger = logging.getLogger(__name__)
audio_service = AudioService()

setup_providers()


@router.get("/providers", response_model=list[ProviderSchema])
async def list_providers() -> list[ProviderSchema]:
    return [
        ProviderSchema(
            id=p.provider_id,
            display_name=p.display_name,
            is_available=p.is_available(),
            is_local=p.is_local,
            capabilities=ProviderCapabilitiesSchema(**p.get_capabilities().__dict__),
        )
        for p in ProviderRegistry.list_all()
    ]


@router.post("/jobs", response_model=GenerationJobSchema, status_code=201)
async def create_generation_job(
    req: CreateJobRequest,
    session: AsyncSession = Depends(get_session),
) -> GenerationJobSchema:
    provider = ProviderRegistry.get(req.provider_id)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {req.provider_id}")
    if not provider.is_available():
        raise HTTPException(status_code=503, detail=f"Provider {req.provider_id} is not available")

    job_id = str(uuid.uuid4())
    output_path = str(audio_service.get_generated_path(req.project_id, job_id))

    job = GenerationJobModel(
        id=job_id,
        project_id=req.project_id,
        prompt=req.prompt,
        provider_id=req.provider_id,
        duration_seconds=req.duration_seconds,
        status="queued",
        progress=0.0,
    )
    session.add(job)
    await session.flush()

    try:
        from sonicforge.jobs.generation_tasks import generate_music_task
        generate_music_task.delay(
            job_id=job_id,
            project_id=req.project_id,
            prompt=req.prompt,
            provider_id=req.provider_id,
            duration_seconds=req.duration_seconds,
            output_path=output_path,
        )
    except Exception as e:
        logger.warning(f"Could not dispatch celery task directly (redis might be offline): {e}")

    await session.refresh(job)
    return GenerationJobSchema(
        id=job.id,
        prompt=job.prompt,
        provider_id=job.provider_id,
        status=job.status,
        progress=job.progress,
        result_path=job.result_path,
        error=job.error,
        created_at=job.created_at,
    )


@router.get("/jobs/{job_id}", response_model=GenerationJobSchema)
async def get_job(job_id: str, session: AsyncSession = Depends(get_session)) -> GenerationJobSchema:
    result = await session.execute(
        select(GenerationJobModel).where(GenerationJobModel.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return GenerationJobSchema(
        id=job.id, prompt=job.prompt, provider_id=job.provider_id,
        status=job.status, progress=job.progress, result_path=job.result_path,
        error=job.error, created_at=job.created_at,
    )


@router.get("/jobs/{job_id}/stream")
async def stream_job_progress(job_id: str, session: AsyncSession = Depends(get_session)):
    import asyncio
    import json

    async def event_generator():
        while True:
            result = await session.execute(
                select(GenerationJobModel).where(GenerationJobModel.id == job_id)
            )
            job = result.scalar_one_or_none()
            if not job:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                break

            data = {
                "status": job.status,
                "progress": job.progress,
                "result_path": job.result_path,
                "error": job.error,
            }
            yield f"data: {json.dumps(data)}\n\n"

            if job.status in ("done", "failed"):
                break

            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/jobs", response_model=list[GenerationJobSchema])
async def list_jobs(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> list[GenerationJobSchema]:
    result = await session.execute(
        select(GenerationJobModel)
        .where(GenerationJobModel.project_id == project_id)
        .order_by(GenerationJobModel.created_at.desc())
    )
    jobs = result.scalars().all()
    return [
        GenerationJobSchema(
            id=j.id, prompt=j.prompt, provider_id=j.provider_id,
            status=j.status, progress=j.progress, result_path=j.result_path,
            error=j.error, created_at=j.created_at,
        )
        for j in jobs
    ]
