"""Export endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.database import get_session
from sonicforge.services.export_service import ExportService

router = APIRouter()
export_service = ExportService()


class ExportRequest(BaseModel):
    format: str = "wav"
    sample_rate: int = 44100
    bit_depth: int = 16


@router.post("/{project_id}/export")
async def export_project(
    project_id: str,
    req: ExportRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    try:
        output_path = export_service.export_project(
            project_id=project_id,
            tracks_data=[],
            format=req.format,
            sample_rate=req.sample_rate,
            bit_depth=req.bit_depth,
        )
        return {"output_path": str(output_path), "format": req.format}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
