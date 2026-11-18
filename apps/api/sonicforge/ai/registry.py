"""Provider registry — single source of truth for available AI providers."""
from __future__ import annotations

import logging
from typing import ClassVar

from sonicforge.ai.base import MusicGenerationProvider

logger = logging.getLogger(__name__)


class ProviderRegistry:
    _providers: ClassVar[dict[str, MusicGenerationProvider]] = {}

    @classmethod
    def register(cls, provider: MusicGenerationProvider) -> None:
        cls._providers[provider.provider_id] = provider
        logger.info(f"Registered provider: {provider.provider_id} ({provider.display_name})")

    @classmethod
    def get(cls, provider_id: str) -> MusicGenerationProvider | None:
        return cls._providers.get(provider_id)

    @classmethod
    def list_all(cls) -> list[MusicGenerationProvider]:
        return list(cls._providers.values())

    @classmethod
    def list_available(cls) -> list[MusicGenerationProvider]:
        return [p for p in cls._providers.values() if p.is_available()]


def setup_providers() -> None:
    """Register all providers. Called at startup."""
    from sonicforge.ai.providers.musicgen_local import MusicGenLocalProvider
    from sonicforge.ai.providers.magnet_local import MagnetLocalProvider
    from sonicforge.ai.providers.huggingface_api import HuggingFaceAPIProvider

    ProviderRegistry.register(MusicGenLocalProvider())
    ProviderRegistry.register(MagnetLocalProvider())
    ProviderRegistry.register(HuggingFaceAPIProvider())
    logger.info(f"Providers registered: {[p.provider_id for p in ProviderRegistry.list_all()]}")
