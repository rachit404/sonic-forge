"""Abstract base class for all AI music generation providers."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProviderCapabilities:
    max_duration_seconds: int = 30
    supports_prompt: bool = True
    supports_audio_input: bool = False
    typical_cpu_minutes: float = 3.0


@dataclass
class GenerationRequest:
    job_id: str
    project_id: str
    prompt: str
    duration_seconds: int
    output_path: str


class MusicGenerationProvider(ABC):
    """Every AI provider must implement this interface."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        ...

    @property
    @abstractmethod
    def display_name(self) -> str:
        ...

    @property
    def is_local(self) -> bool:
        return True

    @abstractmethod
    def is_available(self) -> bool:
        ...

    def get_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities()

    @abstractmethod
    def generate(self, request: GenerationRequest) -> None:
        ...
