"""Business logic for audio import, decoding, slicing, and waveform processing.
Follows the Ponytail principle: standard library first, zero unnecessary dependencies.
"""
from __future__ import annotations

import logging
import math
import mimetypes
import struct
import uuid
import wave
from pathlib import Path

from sonicforge.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".aiff", ".aif", ".m4a"}
MAX_FILE_SIZE_MB = 500


class AudioService:
    def validate_audio_file(self, filename: str, file_size: int) -> None:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported format: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB")

    def get_import_path(self, project_id: str, original_filename: str) -> Path:
        ext = Path(original_filename).suffix.lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        return settings.projects_root / project_id / "assets" / "imported" / unique_name

    def get_generated_path(self, project_id: str, job_id: str) -> Path:
        return settings.projects_root / project_id / "assets" / "generated" / f"{job_id}.wav"

    def resolve_safe_asset_path(self, project_id: str, asset_path: str) -> Path:
        """
        Resolve an asset path ensuring it stays strictly inside the project's assets directory.
        Prevents path traversal attacks.
        """
        project_assets = (settings.projects_root / project_id / "assets").resolve()
        requested = Path(asset_path)
        if not requested.is_absolute():
            requested = (settings.projects_root / project_id / asset_path).resolve()
        else:
            requested = requested.resolve()

        if not str(requested).startswith(str(project_assets)):
            raise ValueError("Access denied: path is outside project assets")
        if not requested.exists():
            raise FileNotFoundError(f"Audio asset does not exist: {requested.name}")
        return requested

    def get_audio_metadata(self, file_path: Path) -> dict:
        """
        Extract duration, sample rate, channels, and sample width.
        Uses Python built-in wave module for WAV files; falls back to pydub.
        """
        # 1. Try standard library wave module first
        if file_path.suffix.lower() == ".wav":
            try:
                with wave.open(str(file_path), "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    channels = wf.getnchannels()
                    width = wf.getsampwidth()
                    duration_s = frames / float(rate) if rate > 0 else 0.0
                    return {
                        "duration_seconds": round(duration_s, 3),
                        "sample_rate": rate,
                        "channels": channels,
                        "sample_width": width,
                    }
            except Exception as e:
                logger.debug(f"Standard wave module failed for {file_path.name}: {e}")

        # 2. Multi-format fallback using pydub
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(str(file_path))
            duration_s = len(audio) / 1000.0
            return {
                "duration_seconds": round(duration_s, 3),
                "sample_rate": audio.frame_rate,
                "channels": audio.channels,
                "sample_width": audio.sample_width,
            }
        except Exception as e:
            logger.warning(f"Could not read metadata for {file_path}: {e}")
            return {"duration_seconds": 0.0, "sample_rate": 44100, "channels": 2, "sample_width": 2}

    def generate_waveform_peaks(self, file_path: Path, num_peaks: int = 400) -> list[float]:
        """
        Generate normalized waveform peaks (0.0 - 1.0) for UI rendering.
        Uses Python built-in wave + struct for WAV; falls back to pydub + numpy.
        """
        # 1. Fast native WAV parsing using standard library
        if file_path.suffix.lower() == ".wav":
            try:
                with wave.open(str(file_path), "rb") as wf:
                    n_channels = wf.getnchannels()
                    samp_width = wf.getsampwidth()
                    n_frames = wf.getnframes()

                    if n_frames <= 0 or samp_width != 2:
                        pass  # Fall back to pydub if not 16-bit PCM
                    else:
                        chunk_frames = max(1, n_frames // num_peaks)
                        peaks: list[float] = []

                        max_val = 32768.0
                        for _ in range(num_peaks):
                            raw_bytes = wf.readframes(chunk_frames)
                            if not raw_bytes:
                                break
                            # Unpack 16-bit signed integers
                            num_shorts = len(raw_bytes) // 2
                            shorts = struct.unpack(f"<{num_shorts}h", raw_bytes)
                            # Get max amplitude in this chunk
                            local_max = 0
                            for idx in range(0, len(shorts), n_channels):
                                val = abs(shorts[idx])
                                if val > local_max:
                                    local_max = val
                            peaks.append(round(min(1.0, local_max / max_val), 4))

                        if peaks:
                            return peaks
            except Exception as e:
                logger.debug(f"Native peak extraction failed for {file_path.name}: {e}")

        # 2. Multi-format fallback using pydub + numpy
        try:
            from pydub import AudioSegment
            import numpy as np

            audio = AudioSegment.from_file(str(file_path)).set_channels(1)
            raw = audio.get_array_of_samples()
            if not raw:
                return []
            samples = np.array(raw, dtype=np.float32)
            max_val = float(np.max(np.abs(samples))) if len(samples) > 0 else 1.0
            if max_val <= 0:
                max_val = 1.0
            samples /= max_val

            chunk_size = max(1, len(samples) // num_peaks)
            peaks = []
            for i in range(0, len(samples), chunk_size):
                chunk = samples[i : i + chunk_size]
                if len(chunk) > 0:
                    peaks.append(round(float(np.max(np.abs(chunk))), 4))
                if len(peaks) >= num_peaks:
                    break

            return peaks
        except Exception as e:
            logger.warning(f"Could not generate peaks for {file_path}: {e}")
            return []

    def slice_audio(
        self,
        source_path: Path,
        dest_path: Path,
        start_ms: int,
        end_ms: int,
        fade_in_ms: int = 0,
        fade_out_ms: int = 0,
    ) -> Path:
        """Non-destructive slice: read source segment and export to a new target file."""
        from pydub import AudioSegment

        audio = AudioSegment.from_file(str(source_path))[start_ms:end_ms]
        if fade_in_ms > 0:
            audio = audio.fade_in(fade_in_ms)
        if fade_out_ms > 0:
            audio = audio.fade_out(fade_out_ms)

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        format_name = dest_path.suffix.lstrip(".").lower() or "wav"
        audio.export(str(dest_path), format=format_name)
        return dest_path

    def get_mime_type(self, file_path: Path) -> str:
        mime, _ = mimetypes.guess_type(str(file_path))
        return mime or "audio/wav"
