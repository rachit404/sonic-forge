# SonicForge — Development Start Script
# Starts Redis (if available), Celery worker, FastAPI backend, and Vite frontend.

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SonicForge — Starting Dev Servers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

# ── Check Redis ───────────────────────────────────────────────
Write-Host "Checking Redis connection..." -NoNewline
$redisPing = redis-cli ping 2>$null
if ($redisPing -eq "PONG") {
    Write-Host " Running" -ForegroundColor Green
} else {
    Write-Host " NOT RUNNING" -ForegroundColor Yellow
    Write-Host "  Attempting to start Redis via Docker..." -ForegroundColor Yellow
    docker run -d --name sonicforge-redis -p 6379:6379 redis:7-alpine 2>$null
    Start-Sleep -Seconds 2
    $redisPing2 = redis-cli ping 2>$null
    if ($redisPing2 -ne "PONG") {
        Write-Host "  Could not start Redis. AI generation jobs will not work." -ForegroundColor Red
        Write-Host "  See scripts/setup.ps1 for Redis installation options." -ForegroundColor Red
    } else {
        Write-Host "  Redis started via Docker." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Starting services in separate terminals..." -ForegroundColor Cyan
Write-Host ""

# ── Start FastAPI backend ─────────────────────────────────────
Write-Host "  [1] FastAPI backend    → http://localhost:8000" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot\apps\api'; uv run uvicorn sonicforge.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 1

# ── Start Celery worker ───────────────────────────────────────
Write-Host "  [2] Celery worker      → background jobs" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot\apps\api'; uv run celery -A sonicforge.jobs.celery_app worker --loglevel=info --concurrency=1" -WindowStyle Normal

Start-Sleep -Seconds 1

# ── Start Vite frontend ───────────────────────────────────────
Write-Host "  [3] Vite frontend      → http://localhost:5173" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot\apps\web'; pnpm dev" -WindowStyle Normal

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  API:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Green
