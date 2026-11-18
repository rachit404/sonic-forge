"""Audio import, streaming, and waveform endpoints."""
from __future__ import annotations

import logging
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
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
    """Import an audio file into a project and return its metadata and precomputed peaks."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    content = await file.read()
    try:
        audio_service.validate_audio_file(file.filename, len(content))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    dest_path = audio_service.get_import_path(project_id, file.filename)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    metadata = audio_service.get_audio_metadata(dest_path)
    peaks = audio_service.generate_waveform_peaks(dest_path, num_peaks=300)
    logger.info(f"Imported audio: {dest_path.name} ({metadata['duration_seconds']}s, {len(peaks)} peaks)")

    return {
        "asset_path": str(dest_path),
        "filename": file.filename,
        "peaks": peaks,
        **metadata,
    }


@router.get("/{project_id}/audio/stream")
async def stream_audio(
    project_id: str,
    asset_path: str = Query(..., description="Full or relative path to the asset within project assets"),
) -> FileResponse:
    """Stream an audio file directly to the frontend player with proper headers."""
    try:
        resolved_path = audio_service.resolve_safe_asset_path(project_id, asset_path)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    media_type = audio_service.get_mime_type(resolved_path)
    return FileResponse(
        path=resolved_path,
        media_type=media_type,
        filename=resolved_path.name,
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/{project_id}/audio/waveform")
async def get_waveform(
    project_id: str,
    asset_path: str = Query(...),
) -> dict:
    """Get waveform peaks for an audio file."""
    try:
        resolved_path = audio_service.resolve_safe_asset_path(project_id, asset_path)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    peaks = audio_service.generate_waveform_peaks(resolved_path)
    return {"peaks": peaks}
