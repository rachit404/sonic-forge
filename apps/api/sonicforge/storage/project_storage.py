"""File system abstraction for project assets."""
from __future__ import annotations

from pathlib import Path

from sonicforge.config import settings


class ProjectStorage:
    def get_project_root(self, project_id: str) -> Path:
        return settings.projects_root / project_id

    def create_project_dirs(self, project_id: str) -> None:
        root = self.get_project_root(project_id)
        (root / "assets" / "imported").mkdir(parents=True, exist_ok=True)
        (root / "assets" / "generated").mkdir(parents=True, exist_ok=True)
        (root / "assets" / "rendered").mkdir(parents=True, exist_ok=True)

    def get_imported_dir(self, project_id: str) -> Path:
        return self.get_project_root(project_id) / "assets" / "imported"

    def get_generated_dir(self, project_id: str) -> Path:
        return self.get_project_root(project_id) / "assets" / "generated"

    def get_rendered_dir(self, project_id: str) -> Path:
        return self.get_project_root(project_id) / "assets" / "rendered"

    def project_exists(self, project_id: str) -> bool:
        return self.get_project_root(project_id).exists()
