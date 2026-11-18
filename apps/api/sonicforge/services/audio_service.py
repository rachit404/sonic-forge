"""Business logic for audio import and processing."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from sonicforge.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".aiff", ".aif", ".m4a"}
MAX_FILE_SIZE_MB = 500


class AudioService:
    def validate_audio_file(self, filename: str, file_size: int) -> None:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB")

    def get_import_path(self, project_id: str, original_filename: str) -> Path:
        ext = Path(original_filename).suffix.lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        return settings.projects_root / project_id / "assets" / "imported" / unique_name

    def get_generated_path(self, project_id: str, job_id: str) -> Path:
        return settings.projects_root / project_id / "assets" / "generated" / f"{job_id}.wav"

    def get_audio_metadata(self, file_path: Path) -> dict:
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(str(file_path))
            return {
                "duration_seconds": len(audio) / 1000.0,
                "sample_rate": audio.frame_rate,
                "channels": audio.channels,
                "duration_beats": None,
            }
        except Exception as e:
            logger.warning(f"Could not read metadata for {file_path}: {e}")
            return {"duration_seconds": 0.0, "sample_rate": 44100, "channels": 2}

    def generate_waveform_peaks(self, file_path: Path, num_peaks: int = 1000) -> list[float]:
        try:
            from pydub import AudioSegment
            import numpy as np

            audio = AudioSegment.from_file(str(file_path)).set_channels(1)
            samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
            max_val = max(abs(float(samples.max())), abs(float(samples.min())), 1.0)
            samples /= max_val

            chunk_size = max(1, len(samples) // num_peaks)
            peaks = []
            for i in range(0, len(samples), chunk_size):
                chunk = samples[i : i + chunk_size]
                peaks.append(float(np.max(np.abs(chunk))))
                if len(peaks) >= num_peaks:
                    break

            return peaks
        except Exception as e:
            logger.warning(f"Could not generate peaks for {file_path}: {e}")
            return []
