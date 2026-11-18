"""FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sonicforge.config import settings
from sonicforge.database import init_db
from sonicforge.api import projects, tracks, audio, generation, export_routes

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SonicForge API starting up...")
    await init_db()
    logger.info("Database initialized")
    logger.info(f"Projects root: {settings.projects_root}")
    logger.info(f"Models cache: {settings.models_cache_dir}")
    yield
    logger.info("SonicForge API shutting down...")


app = FastAPI(
    title="SonicForge API",
    description="AI-assisted music production backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tracks.router, prefix="/api/projects", tags=["tracks"])
app.include_router(audio.router, prefix="/api/projects", tags=["audio"])
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(export_routes.router, prefix="/api/projects", tags=["export"])


@app.get("/api/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0", "env": settings.app_env}


@app.get("/", tags=["system"])
async def root() -> dict[str, str]:
    return {"message": "SonicForge API — see /docs for API reference"}
