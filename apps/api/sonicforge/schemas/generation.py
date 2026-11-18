"""Pydantic schemas for AI generation endpoints."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ProviderCapabilitiesSchema(BaseModel):
    max_duration_seconds: int
    supports_prompt: bool
    supports_audio_input: bool
    typical_cpu_minutes: float


class ProviderSchema(BaseModel):
    id: str
    display_name: str
    is_available: bool
    is_local: bool
    capabilities: ProviderCapabilitiesSchema


class CreateJobRequest(BaseModel):
    project_id: str
    prompt: str = Field(min_length=1, max_length=500)
    provider_id: str
    duration_seconds: int = Field(default=10, ge=1, le=60)


class GenerationJobSchema(BaseModel):
    id: str
    prompt: str
    provider_id: str
    status: str
    progress: float
    result_path: str | None
    error: str | None
    created_at: datetime
