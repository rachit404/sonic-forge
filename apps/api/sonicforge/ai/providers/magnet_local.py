"""
MAGNeT Small — local CPU inference provider.
Model: facebook/magnet-small-10secs (~300MB, MIT license)
"""
from __future__ import annotations

import logging
from pathlib import Path

from sonicforge.ai.base import GenerationRequest, MusicGenerationProvider, ProviderCapabilities
from sonicforge.config import settings

logger = logging.getLogger(__name__)

MODEL_ID = "facebook/magnet-small-10secs"


class MagnetLocalProvider(MusicGenerationProvider):
    @property
    def provider_id(self) -> str:
        return "magnet-small-local"

    @property
    def display_name(self) -> str:
        return "MAGNeT Small (Local CPU)"

    @property
    def is_local(self) -> bool:
        return True

    def is_available(self) -> bool:
        try:
            import transformers  # noqa: F401
            import torch  # noqa: F401
            return True
        except ImportError:
            return False

    def get_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            max_duration_seconds=10,
            supports_prompt=True,
            supports_audio_input=False,
            typical_cpu_minutes=2.0,
        )

    def generate(self, request: GenerationRequest) -> None:
        import scipy.io.wavfile
        import torch
        from transformers import AutoProcessor, MusicgenForConditionalGeneration

        logger.info(f"[MAGNeT] Starting generation for job {request.job_id}")

        cache_dir = str(settings.models_cache_dir / "magnet-small")

        processor = AutoProcessor.from_pretrained(MODEL_ID, cache_dir=cache_dir)
        model = MusicgenForConditionalGeneration.from_pretrained(
            MODEL_ID,
            cache_dir=cache_dir,
        )
        model.to("cpu")
        model.eval()

        inputs = processor(text=[request.prompt], padding=True, return_tensors="pt")
        max_new_tokens = min(request.duration_seconds, 10) * 50

        with torch.no_grad():
            audio_values = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=True)

        sample_rate = model.config.audio_encoder.sampling_rate
        audio_data = audio_values[0, 0].cpu().numpy()

        output_path = Path(request.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        scipy.io.wavfile.write(str(output_path), rate=sample_rate, data=audio_data)

        logger.info(f"[MAGNeT] Saved to {output_path}")
