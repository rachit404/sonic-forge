"""Celery tasks for AI music generation."""
from __future__ import annotations

import logging
from pathlib import Path

from sonicforge.jobs.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="sonicforge.generate_music")
def generate_music_task(
    self,
    job_id: str,
    project_id: str,
    prompt: str,
    provider_id: str,
    duration_seconds: int,
    output_path: str,
) -> dict:
    import asyncio
    from sonicforge.ai.base import GenerationRequest
    from sonicforge.ai.registry import ProviderRegistry

    logger.info(f"[Task] generate_music_task started — job_id={job_id}")
    asyncio.run(_update_job_status(job_id, "running", 0.0))

    try:
        provider = ProviderRegistry.get(provider_id)
        if provider is None:
            raise ValueError(f"Provider not found: {provider_id}")

        if not provider.is_available():
            raise RuntimeError(f"Provider {provider_id} is not available")

        request = GenerationRequest(
            job_id=job_id,
            project_id=project_id,
            prompt=prompt,
            duration_seconds=duration_seconds,
            output_path=output_path,
        )

        self.update_state(state="PROGRESS", meta={"progress": 10})
        asyncio.run(_update_job_status(job_id, "running", 10.0))

        provider.generate(request)

        asyncio.run(_update_job_status(job_id, "done", 100.0, result_path=output_path))
        logger.info(f"[Task] Job {job_id} completed successfully")
        return {"status": "done", "output_path": output_path}

    except Exception as exc:
        logger.exception(f"[Task] Job {job_id} failed: {exc}")
        asyncio.run(_update_job_status(job_id, "failed", 0.0, error=str(exc)))
        raise


async def _update_job_status(
    job_id: str,
    status: str,
    progress: float,
    result_path: str | None = None,
    error: str | None = None,
) -> None:
    from sonicforge.database import async_session_maker
    from sonicforge.models.generation_job import GenerationJobModel
    from sqlalchemy import select

    async with async_session_maker() as session:
        result = await session.execute(
            select(GenerationJobModel).where(GenerationJobModel.id == job_id)
        )
        job = result.scalar_one_or_none()
        if job:
            job.status = status
            job.progress = progress
            if result_path:
                job.result_path = result_path
            if error:
                job.error = error
            await session.commit()
