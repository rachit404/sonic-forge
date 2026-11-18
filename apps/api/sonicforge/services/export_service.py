"""Business logic for audio export and mixdown."""
from __future__ import annotations

import logging
import uuid
from pathlib import Path

from sonicforge.config import settings

logger = logging.getLogger(__name__)

EXPORT_FORMATS = {"wav", "mp3", "flac", "ogg"}


class ExportService:
    def get_export_path(self, project_id: str, format: str) -> Path:
        filename = f"export_{uuid.uuid4()}.{format}"
        return settings.projects_root / project_id / "assets" / "rendered" / filename

    def export_project(
        self,
        project_id: str,
        tracks_data: list[dict],
        format: str = "wav",
        sample_rate: int = 44100,
        bit_depth: int = 16,
        bpm: int = 120,
    ) -> Path:
        from pydub import AudioSegment

        if format not in EXPORT_FORMATS:
            raise ValueError(f"Unsupported format: {format}")

        logger.info(f"[Export] Starting export for project {project_id}")
        mixed = AudioSegment.silent(duration=30_000)

        output_path = self.get_export_path(project_id, format)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        export_params: dict = {"format": format}
        if format == "mp3":
            export_params["bitrate"] = "320k"

        mixed.export(str(output_path), **export_params)
        logger.info(f"[Export] Exported to {output_path}")
        return output_path
