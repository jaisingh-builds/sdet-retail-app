$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

if (-not (Test-Path ".env")) {
    throw "Missing .env. Copy .env.example to .env and provide local training secrets."
}

npm run db:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run start
exit $LASTEXITCODE
