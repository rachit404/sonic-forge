"""Audio import and waveform endpoints."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.database import get_session
from sonicforge.services.audio_service import AudioService

router = APIRouter()
logger = logging.getLogger(__name__)
audio_service = AudioService()


@router.post("/{project_id}/audio/import")
async def import_audio(
    project_id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    content = await file.read()
    try:
        audio_service.validate_audio_file(file.filename, len(content))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    dest_path = audio_service.get_import_path(project_id, file.filename)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    metadata = audio_service.get_audio_metadata(dest_path)
    logger.info(f"Imported audio: {dest_path} ({metadata['duration_seconds']:.1f}s)")

    return {
        "asset_path": str(dest_path),
        "filename": file.filename,
        **metadata,
    }


@router.get("/{project_id}/audio/waveform")
async def get_waveform(
    project_id: str,
    asset_path: str = Query(...),
) -> dict:
    full_path = Path(asset_path)
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    peaks = audio_service.generate_waveform_peaks(full_path)
    return {"peaks": peaks}
