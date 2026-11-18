"""Track management endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.database import get_session
from sonicforge.models.track import TrackModel
from sonicforge.schemas.project import TrackSchema

router = APIRouter()

TRACK_COLORS = [
    "#4a9eff", "#ff6b9d", "#7cfc00", "#ffa500",
    "#da70d6", "#00ced1", "#ff4500", "#adff2f",
]


class CreateTrackRequest(BaseModel):
    name: str = "Track"


class UpdateTrackRequest(BaseModel):
    name: str | None = None
    volume: float | None = None
    pan: float | None = None
    muted: bool | None = None
    solo: bool | None = None


@router.post("/{project_id}/tracks", response_model=TrackSchema, status_code=201)
async def create_track(
    project_id: str,
    req: CreateTrackRequest,
    session: AsyncSession = Depends(get_session),
) -> TrackSchema:
    result = await session.execute(
        select(TrackModel).where(TrackModel.project_id == project_id)
    )
    existing = list(result.scalars().all())
    color = TRACK_COLORS[len(existing) % len(TRACK_COLORS)]

    track = TrackModel(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=req.name,
        color=color,
        order_index=len(existing),
    )
    session.add(track)
    await session.flush()
    await session.refresh(track)

    return TrackSchema(id=track.id, name=track.name, color=track.color, clips=[])


@router.patch("/{project_id}/tracks/{track_id}", response_model=TrackSchema)
async def update_track(
    project_id: str,
    track_id: str,
    req: UpdateTrackRequest,
    session: AsyncSession = Depends(get_session),
) -> TrackSchema:
    result = await session.execute(
        select(TrackModel).where(TrackModel.id == track_id, TrackModel.project_id == project_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if req.name is not None:
        track.name = req.name
    if req.volume is not None:
        track.volume = req.volume
    if req.pan is not None:
        track.pan = req.pan
    if req.muted is not None:
        track.muted = req.muted
    if req.solo is not None:
        track.solo = req.solo

    await session.flush()
    return TrackSchema(
        id=track.id, name=track.name, volume=track.volume, pan=track.pan,
        muted=track.muted, solo=track.solo, color=track.color,
        clips=[],
    )


@router.delete("/{project_id}/tracks/{track_id}", status_code=204)
async def delete_track(
    project_id: str,
    track_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(
        select(TrackModel).where(TrackModel.id == track_id, TrackModel.project_id == project_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    await session.delete(track)
