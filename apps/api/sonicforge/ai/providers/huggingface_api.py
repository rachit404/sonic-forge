"""
Hugging Face Serverless Inference API provider.
"""
from __future__ import annotations

import logging
from pathlib import Path

import httpx

from sonicforge.ai.base import GenerationRequest, MusicGenerationProvider, ProviderCapabilities
from sonicforge.config import settings

logger = logging.getLogger(__name__)

HF_API_URL = "https://api-inference.huggingface.co/models/facebook/musicgen-small"


class HuggingFaceAPIProvider(MusicGenerationProvider):
    @property
    def provider_id(self) -> str:
        return "huggingface-api"

    @property
    def display_name(self) -> str:
        return "HuggingFace API (Remote)"

    @property
    def is_local(self) -> bool:
        return False

    def is_available(self) -> bool:
        return bool(settings.huggingface_api_key)

    def get_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            max_duration_seconds=20,
            supports_prompt=True,
            supports_audio_input=False,
            typical_cpu_minutes=0.5,
        )

    def generate(self, request: GenerationRequest) -> None:
        logger.info(f"[HF API] Starting remote generation for job {request.job_id}")

        if not settings.huggingface_api_key:
            raise ValueError("HUGGINGFACE_API_KEY not configured")

        headers = {"Authorization": f"Bearer {settings.huggingface_api_key}"}
        payload = {
            "inputs": request.prompt,
            "parameters": {"max_new_tokens": request.duration_seconds * 50},
        }

        with httpx.Client(timeout=120.0) as client:
            response = client.post(HF_API_URL, json=payload, headers=headers)

        if response.status_code != 200:
            raise RuntimeError(f"HF API error {response.status_code}: {response.text}")

        output_path = Path(request.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(response.content)

        logger.info(f"[HF API] Saved to {output_path}")
