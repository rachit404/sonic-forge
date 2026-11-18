# SonicForge — Setup Script
# Run this once to install dependencies and check prerequisites.

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SonicForge — Development Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()

# ── Check Node.js ────────────────────────────────────────────
Write-Host "Checking Node.js..." -NoNewline
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND" -ForegroundColor Red
    $errors += "Node.js not found. Install from https://nodejs.org (v20+)"
} else {
    Write-Host " $nodeVersion" -ForegroundColor Green
}

# ── Check pnpm ────────────────────────────────────────────────
Write-Host "Checking pnpm..." -NoNewline
$pnpmVersion = pnpm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND — installing..." -ForegroundColor Yellow
    npm install -g pnpm
} else {
    Write-Host " $pnpmVersion" -ForegroundColor Green
}

# ── Check Python ──────────────────────────────────────────────
Write-Host "Checking Python..." -NoNewline
$pyVersion = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND" -ForegroundColor Red
    $errors += "Python 3.11+ not found. Install from https://python.org"
} else {
    Write-Host " $pyVersion" -ForegroundColor Green
}

# ── Check FFmpeg ──────────────────────────────────────────────
Write-Host "Checking FFmpeg..." -NoNewline
$ffmpegVersion = ffmpeg -version 2>$null | Select-Object -First 1
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND" -ForegroundColor Red
    $errors += "FFmpeg not found. Install from https://ffmpeg.org/download.html and add to PATH"
} else {
    Write-Host " Found" -ForegroundColor Green
}

# ── Check Redis ───────────────────────────────────────────────
Write-Host "Checking Redis..." -NoNewline
$redisVersion = redis-cli --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND" -ForegroundColor Yellow
    Write-Host "  Redis not found. Options:" -ForegroundColor Yellow
    Write-Host "  1. Install via Memurai (Windows Redis): https://www.memurai.com" -ForegroundColor Yellow
    Write-Host "  2. Use WSL2: sudo apt install redis-server" -ForegroundColor Yellow
    Write-Host "  3. Run via Docker: docker run -d -p 6379:6379 redis:7-alpine" -ForegroundColor Yellow
} else {
    Write-Host " $redisVersion" -ForegroundColor Green
}

# ── Check uv ──────────────────────────────────────────────────
Write-Host "Checking uv (Python package manager)..." -NoNewline
$uvVersion = uv --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host " NOT FOUND — installing..." -ForegroundColor Yellow
    Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
} else {
    Write-Host " $uvVersion" -ForegroundColor Green
}

# ── Report errors ─────────────────────────────────────────────
if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠ Prerequisites missing:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Fix the above and re-run this script." -ForegroundColor Yellow
    exit 1
}

# ── Install frontend dependencies ─────────────────────────────
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location apps/web
pnpm install
Set-Location ../..

# ── Install backend dependencies ──────────────────────────────
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location apps/api
uv sync
Set-Location ../..

# ── Copy .env if not present ─────────────────────────────────
if (-not (Test-Path "apps/api/.env")) {
    Copy-Item "apps/api/.env.example" "apps/api/.env"
    Write-Host "Created apps/api/.env from example — edit it to configure." -ForegroundColor Yellow
}
if (-not (Test-Path "apps/web/.env")) {
    Copy-Item "apps/web/.env.example" "apps/web/.env"
    Write-Host "Created apps/web/.env from example." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "  Run: .\scripts\dev.ps1 to start" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
