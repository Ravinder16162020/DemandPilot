$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root 'backend-api'
$mlPath = Join-Path $root 'ml-service'

Write-Host '[demo-start] Initializing database...' -ForegroundColor Cyan
Push-Location $backendPath
npm run db:init
npm run db:seed
Pop-Location

Write-Host '[demo-start] Starting backend-api on :4000...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "Set-Location '$backendPath'; npm run dev") | Out-Null

Write-Host '[demo-start] Starting ml-service on :8000...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "Set-Location '$mlPath'; .\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000") | Out-Null

Write-Host '[demo-start] Waiting for services to boot...' -ForegroundColor Cyan
$maxAttempts = 30
$ready = $false

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
	Start-Sleep -Seconds 1
	try {
		$backend = Invoke-RestMethod -Uri 'http://localhost:4000/api/health' -Method Get -TimeoutSec 2
		$ml = Invoke-RestMethod -Uri 'http://localhost:8000/health' -Method Get -TimeoutSec 2

		if ($backend.status -eq 'ok' -and $ml.status -eq 'ok') {
			$ready = $true
			break
		}
	} catch {
		# keep retrying until timeout
	}
}

if (-not $ready) {
	throw '[demo-start] Services failed health checks before timeout.'
}

Write-Host '[demo-start] Running validation...' -ForegroundColor Cyan
Push-Location $root
node scripts/demo-validate.mjs
Pop-Location

Write-Host '[demo-start] Demo environment ready.' -ForegroundColor Green
