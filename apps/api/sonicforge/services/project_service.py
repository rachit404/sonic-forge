"""Business logic for project management."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.models.project import ProjectModel
from sonicforge.models.track import TrackModel
from sonicforge.schemas.project import (
    ClipSchema,
    CreateProjectRequest,
    ProjectSchema,
    TrackSchema,
    UpdateProjectRequest,
)
from sonicforge.storage.project_storage import ProjectStorage


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.storage = ProjectStorage()

    async def list_projects(self) -> list[ProjectSchema]:
        result = await self.session.execute(
            select(ProjectModel).order_by(ProjectModel.updated_at.desc())
        )
        projects = result.scalars().all()
        schemas = []
        for p in projects:
            tracks = await self._get_tracks_for_project(p.id)
            schemas.append(self._to_schema(p, tracks))
        return schemas

    async def get_project(self, project_id: str) -> ProjectSchema | None:
        result = await self.session.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return None
        tracks = await self._get_tracks_for_project(project_id)
        return self._to_schema(project, tracks)

    async def create_project(self, req: CreateProjectRequest) -> ProjectSchema:
        project_id = str(uuid.uuid4())
        project = ProjectModel(
            id=project_id,
            name=req.name,
            bpm=req.bpm,
        )
        self.session.add(project)
        await self.session.flush()

        self.storage.create_project_dirs(project_id)

        await self.session.refresh(project)
        return self._to_schema(project, [])

    async def update_project(self, project_id: str, req: UpdateProjectRequest) -> ProjectSchema | None:
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
        await self.session.flush()
        tracks = await self._get_tracks_for_project(project_id)
        return self._to_schema(project, tracks)

    async def delete_project(self, project_id: str) -> bool:
        result = await self.session.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return False
        await self.session.delete(project)
        return True

    async def _get_tracks_for_project(self, project_id: str) -> list[TrackModel]:
        result = await self.session.execute(
            select(TrackModel)
            .where(TrackModel.project_id == project_id)
            .order_by(TrackModel.order_index)
        )
        return list(result.scalars().all())

    def _to_schema(self, project: ProjectModel, tracks: list[TrackModel]) -> ProjectSchema:
        return ProjectSchema(
            id=project.id,
            name=project.name,
            bpm=project.bpm,
            time_signature=(project.time_signature_num, project.time_signature_den),
            created_at=project.created_at,
            updated_at=project.updated_at,
            tracks=[
                TrackSchema(
                    id=t.id,
                    name=t.name,
                    volume=t.volume,
                    pan=t.pan,
                    muted=t.muted,
                    solo=t.solo,
                    color=t.color,
                    clips=[ClipSchema(**c) for c in (t.clips or [])],
                )
                for t in tracks
            ],
        )
