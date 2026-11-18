"""Celery application configuration."""
from __future__ import annotations

from celery import Celery

from sonicforge.config import settings

celery_app = Celery(
    "sonicforge",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["sonicforge.jobs.generation_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_concurrency=1,
    task_soft_time_limit=1800,
    task_time_limit=2100,
)
