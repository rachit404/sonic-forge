"""Project CRUD endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sonicforge.database import get_session
from sonicforge.schemas.project import CreateProjectRequest, ProjectSchema, UpdateProjectRequest
from sonicforge.services.project_service import ProjectService

router = APIRouter()


@router.get("", response_model=list[ProjectSchema])
async def list_projects(session: AsyncSession = Depends(get_session)) -> list[ProjectSchema]:
    return await ProjectService(session).list_projects()


@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(project_id: str, session: AsyncSession = Depends(get_session)) -> ProjectSchema:
    project = await ProjectService(session).get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    req: CreateProjectRequest, session: AsyncSession = Depends(get_session)
) -> ProjectSchema:
    return await ProjectService(session).create_project(req)


@router.patch("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    req: UpdateProjectRequest,
    session: AsyncSession = Depends(get_session),
) -> ProjectSchema:
    project = await ProjectService(session).update_project(project_id, req)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str, session: AsyncSession = Depends(get_session)
) -> None:
    deleted = await ProjectService(session).delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
