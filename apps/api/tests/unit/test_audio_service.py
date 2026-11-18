"""Unit tests for AudioService (validation, security, peaks, and slicing)."""
import math
import struct
import wave
from pathlib import Path
import pytest

from sonicforge.services.audio_service import AudioService
from sonicforge.config import settings


@pytest.fixture
def audio_service():
    return AudioService()


@pytest.fixture
def sample_wav(tmp_path):
    """Generate a valid, tiny 0.2-second 44.1kHz mono WAV file for testing."""
    wav_path = tmp_path / "test_sine.wav"
    sample_rate = 44100
    duration_s = 0.2
    num_samples = int(sample_rate * duration_s)
    frequency = 440.0

    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_samples):
            value = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
            frames.extend(struct.pack("<h", value))
        wf.writeframes(frames)

    return wav_path


def test_validate_audio_file_success(audio_service):
    for valid_ext in [".mp3", ".wav", ".flac", ".ogg", ".aiff", ".m4a"]:
        audio_service.validate_audio_file(f"track{valid_ext}", 1024 * 1024)


def test_validate_audio_file_unsupported_ext(audio_service):
    with pytest.raises(ValueError, match="Unsupported format"):
        audio_service.validate_audio_file("virus.exe", 1024)

    with pytest.raises(ValueError, match="Unsupported format"):
        audio_service.validate_audio_file("document.pdf", 1024)


def test_validate_audio_file_oversized(audio_service):
    too_large = 600 * 1024 * 1024  # 600 MB
    with pytest.raises(ValueError, match="File too large"):
        audio_service.validate_audio_file("huge.wav", too_large)


def test_resolve_safe_asset_path_security(audio_service, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "projects_root", tmp_path)
    project_id = "proj-123"
    assets_dir = tmp_path / project_id / "assets" / "imported"
    assets_dir.mkdir(parents=True, exist_ok=True)
    real_file = assets_dir / "audio.wav"
    real_file.write_text("dummy")

    # Safe access
    resolved = audio_service.resolve_safe_asset_path(project_id, str(real_file))
    assert resolved == real_file

    # Traversal attack attempt outside assets
    with pytest.raises(ValueError, match="Access denied"):
        audio_service.resolve_safe_asset_path(project_id, str(tmp_path / "secret.txt"))


def test_get_mime_type(audio_service):
    assert audio_service.get_mime_type(Path("test.wav")) == "audio/wav"
    assert audio_service.get_mime_type(Path("test.mp3")) == "audio/mpeg"
    assert audio_service.get_mime_type(Path("test.ogg")) == "audio/ogg"


def test_waveform_peaks_and_metadata(audio_service, sample_wav):
    metadata = audio_service.get_audio_metadata(sample_wav)
    assert metadata["duration_seconds"] > 0.1
    assert metadata["sample_rate"] == 44100
    assert metadata["channels"] == 1

    peaks = audio_service.generate_waveform_peaks(sample_wav, num_peaks=50)
    assert len(peaks) > 0
    assert all(0.0 <= p <= 1.0 for p in peaks)
