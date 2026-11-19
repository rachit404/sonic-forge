"""Track management endpoints."""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.database import get_session
from sonicforge.models.track import TrackModel
from sonicforge.schemas.project import ClipSchema, TrackSchema

router = APIRouter()

TRACK_COLORS = [
    "#4a9eff", "#ff6b9d", "#7cfc00", "#ffa500",
    "#da70d6", "#00ced1", "#ff4500", "#adff2f",
]


class CreateTrackRequest(BaseModel):
    name: str = "Track"


class UpdateTrackRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    volume: float | None = None
    pan: float | None = None
    muted: bool | None = None
    solo: bool | None = None
    color: str | None = None
    clips: list[dict[str, Any]] | None = None


def _format_track(track: TrackModel) -> dict[str, Any]:
    """Return track formatted with both snake_case and camelCase compatibility."""
    raw_clips = track.clips or []
    formatted_clips = []
    for c in raw_clips:
        formatted_clips.append({
            "id": c.get("id", str(uuid.uuid4())),
            "name": c.get("name") or "Audio Clip",
            "asset_path": c.get("asset_path") or c.get("assetPath") or "",
            "assetPath": c.get("assetPath") or c.get("asset_path") or "",
            "start_beat": float(c.get("start_beat") if c.get("start_beat") is not None else c.get("startBeat", 0)),
            "startBeat": float(c.get("startBeat") if c.get("startBeat") is not None else c.get("start_beat", 0)),
            "duration_beats": float(c.get("duration_beats") if c.get("duration_beats") is not None else c.get("durationBeats", 4)),
            "durationBeats": float(c.get("durationBeats") if c.get("durationBeats") is not None else c.get("duration_beats", 4)),
            "trim_start": float(c.get("trim_start") if c.get("trim_start") is not None else c.get("trimStart", 0)),
            "trimStart": float(c.get("trimStart") if c.get("trimStart") is not None else c.get("trim_start", 0)),
            "trim_end": float(c.get("trim_end") if c.get("trim_end") is not None else c.get("trimEnd", 0)),
            "trimEnd": float(c.get("trimEnd") if c.get("trimEnd") is not None else c.get("trim_end", 0)),
            "fade_in": float(c.get("fade_in") if c.get("fade_in") is not None else c.get("fadeIn", 0)),
            "fadeIn": float(c.get("fadeIn") if c.get("fadeIn") is not None else c.get("fade_in", 0)),
            "fade_out": float(c.get("fade_out") if c.get("fade_out") is not None else c.get("fadeOut", 0)),
            "fadeOut": float(c.get("fadeOut") if c.get("fadeOut") is not None else c.get("fade_out", 0)),
            "volume": float(c.get("volume", 1.0)),
            "peaks": c.get("peaks") or [],
        })

    return {
        "id": track.id,
        "name": track.name,
        "volume": track.volume,
        "pan": track.pan,
        "muted": track.muted,
        "solo": track.solo,
        "color": track.color,
        "clips": formatted_clips,
    }


@router.post("/{project_id}/tracks", status_code=status.HTTP_201_CREATED)
async def create_track(
    project_id: str,
    req: CreateTrackRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
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
        clips=[],
    )
    session.add(track)
    await session.commit()
    await session.refresh(track)

    return _format_track(track)


@router.patch("/{project_id}/tracks/{track_id}")
async def update_track(
    project_id: str,
    track_id: str,
    req: UpdateTrackRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
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
    if req.color is not None:
        track.color = req.color
    if req.clips is not None:
        # Normalize and persist clips directly to database
        normalized = []
        for c in req.clips:
            normalized.append({
                "id": c.get("id", str(uuid.uuid4())),
                "name": c.get("name") or "Audio Clip",
                "asset_path": c.get("asset_path") or c.get("assetPath") or "",
                "assetPath": c.get("assetPath") or c.get("asset_path") or "",
                "start_beat": float(c.get("start_beat") if c.get("start_beat") is not None else c.get("startBeat", 0)),
                "startBeat": float(c.get("startBeat") if c.get("startBeat") is not None else c.get("start_beat", 0)),
                "duration_beats": float(c.get("duration_beats") if c.get("duration_beats") is not None else c.get("durationBeats", 4)),
                "durationBeats": float(c.get("durationBeats") if c.get("durationBeats") is not None else c.get("duration_beats", 4)),
                "trim_start": float(c.get("trim_start") if c.get("trim_start") is not None else c.get("trimStart", 0)),
                "trimStart": float(c.get("trimStart") if c.get("trimStart") is not None else c.get("trim_start", 0)),
                "trim_end": float(c.get("trim_end") if c.get("trim_end") is not None else c.get("trimEnd", 0)),
                "trimEnd": float(c.get("trimEnd") if c.get("trimEnd") is not None else c.get("trim_end", 0)),
                "fade_in": float(c.get("fade_in") if c.get("fade_in") is not None else c.get("fadeIn", 0)),
                "fadeIn": float(c.get("fadeIn") if c.get("fadeIn") is not None else c.get("fade_in", 0)),
                "fade_out": float(c.get("fade_out") if c.get("fade_out") is not None else c.get("fadeOut", 0)),
                "fadeOut": float(c.get("fadeOut") if c.get("fadeOut") is not None else c.get("fade_out", 0)),
                "volume": float(c.get("volume", 1.0)),
                "peaks": c.get("peaks") or [],
            })
        track.clips = normalized

    await session.commit()
    await session.refresh(track)
    return _format_track(track)


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
    await session.commit()
