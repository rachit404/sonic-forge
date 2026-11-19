"""Business logic for project management."""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.models.project import ProjectModel
from sonicforge.models.track import TrackModel
from sonicforge.schemas.project import CreateProjectRequest, UpdateProjectRequest
from sonicforge.storage.project_storage import ProjectStorage


def _format_clip(c: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": c.get("id", str(uuid.uuid4())),
        "name": c.get("name") or "Audio Clip",
        "assetPath": c.get("assetPath") or c.get("asset_path") or "",
        "asset_path": c.get("asset_path") or c.get("assetPath") or "",
        "startBeat": float(c.get("startBeat") if c.get("startBeat") is not None else c.get("start_beat", 0)),
        "start_beat": float(c.get("start_beat") if c.get("start_beat") is not None else c.get("startBeat", 0)),
        "durationBeats": float(c.get("durationBeats") if c.get("durationBeats") is not None else c.get("duration_beats", 4)),
        "duration_beats": float(c.get("duration_beats") if c.get("duration_beats") is not None else c.get("durationBeats", 4)),
        "trimStart": float(c.get("trimStart") if c.get("trimStart") is not None else c.get("trim_start", 0)),
        "trim_start": float(c.get("trim_start") if c.get("trim_start") is not None else c.get("trimStart", 0)),
        "trimEnd": float(c.get("trimEnd") if c.get("trimEnd") is not None else c.get("trim_end", 0)),
        "trim_end": float(c.get("trim_end") if c.get("trim_end") is not None else c.get("trimEnd", 0)),
        "fadeIn": float(c.get("fadeIn") if c.get("fadeIn") is not None else c.get("fade_in", 0)),
        "fade_in": float(c.get("fade_in") if c.get("fade_in") is not None else c.get("fadeIn", 0)),
        "fadeOut": float(c.get("fadeOut") if c.get("fadeOut") is not None else c.get("fade_out", 0)),
        "fade_out": float(c.get("fade_out") if c.get("fade_out") is not None else c.get("fadeOut", 0)),
        "volume": float(c.get("volume", 1.0)),
        "peaks": c.get("peaks") or [],
    }


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.storage = ProjectStorage()

    async def list_projects(self) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(ProjectModel).order_by(ProjectModel.updated_at.desc())
        )
        projects = result.scalars().all()
        schemas = []
        for p in projects:
            tracks = await self._get_tracks_for_project(p.id)
            schemas.append(self._to_dict(p, tracks))
        return schemas

    async def get_project(self, project_id: str) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return None
        tracks = await self._get_tracks_for_project(project_id)
        return self._to_dict(project, tracks)

    async def create_project(self, req: CreateProjectRequest) -> dict[str, Any]:
        project_id = str(uuid.uuid4())
        project = ProjectModel(
            id=project_id,
            name=req.name,
            bpm=req.bpm,
        )
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)

        # Create project folder structure and initial project.json
        self.storage.create_project_dirs(project_id)
        self._write_project_file(project, [])

        return self._to_dict(project, [])

    async def update_project(self, project_id: str, req: UpdateProjectRequest) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return None
        if req.name is not None:
            project.name = req.name
        if req.bpm is not None:
            project.bpm = req.bpm
        await self.session.commit()
        await self.session.refresh(project)

        tracks = await self._get_tracks_for_project(project_id)
        self._write_project_file(project, tracks)
        return self._to_dict(project, tracks)

    async def delete_project(self, project_id: str) -> bool:
        result = await self.session.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return False
        await self.session.delete(project)
        await self.session.commit()
        return True

    async def _get_tracks_for_project(self, project_id: str) -> list[TrackModel]:
        result = await self.session.execute(
            select(TrackModel)
            .where(TrackModel.project_id == project_id)
            .order_by(TrackModel.order_index)
        )
        return list(result.scalars().all())

    def _to_dict(self, project: ProjectModel, tracks: list[TrackModel]) -> dict[str, Any]:
        return {
            "id": project.id,
            "name": project.name,
            "bpm": project.bpm,
            "timeSignature": [project.time_signature_num, project.time_signature_den],
            "time_signature": [project.time_signature_num, project.time_signature_den],
            "createdAt": project.created_at.isoformat() if project.created_at else datetime.utcnow().isoformat(),
            "updatedAt": project.updated_at.isoformat() if project.updated_at else datetime.utcnow().isoformat(),
            "tracks": [
                {
                    "id": t.id,
                    "name": t.name,
                    "volume": t.volume,
                    "pan": t.pan,
                    "muted": t.muted,
                    "solo": t.solo,
                    "color": t.color,
                    "clips": [_format_clip(c) for c in (t.clips or [])],
                }
                for t in tracks
            ],
        }

    def _write_project_file(self, project: ProjectModel, tracks: list[TrackModel]) -> None:
        """Write human-readable project.json non-destructively in project root."""
        try:
            root = self.storage.get_project_root(project.id)
            project_json_path = root / "project.json"
            project_data = self._to_dict(project, tracks)
            project_json_path.write_text(json.dumps(project_data, indent=2), encoding="utf-8")
        except Exception:
            pass
