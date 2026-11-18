"""Pydantic schemas for Project endpoints."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ClipSchema(BaseModel):
    id: str
    asset_path: str
    start_beat: float
    duration_beats: float
    trim_start: float = 0.0
    trim_end: float = 0.0
    fade_in: float = 0.0
    fade_out: float = 0.0
    volume: float = 1.0
    peaks: list[float] | None = None
    name: str | None = None


class TrackSchema(BaseModel):
    id: str
    name: str
    volume: float = 1.0
    pan: float = 0.0
    muted: bool = False
    solo: bool = False
    color: str = "#4a9eff"
    clips: list[ClipSchema] = []


class ProjectSchema(BaseModel):
    id: str
    name: str
    bpm: int = 120
    time_signature: tuple[int, int] = (4, 4)
    created_at: datetime
    updated_at: datetime
    tracks: list[TrackSchema] = []


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    bpm: int = Field(default=120, ge=20, le=300)


class UpdateProjectRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    bpm: int | None = Field(default=None, ge=20, le=300)
