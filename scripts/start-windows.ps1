$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
docker compose up -d --build
Write-Host "Prelegal running at http://localhost:8000"
