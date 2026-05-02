# Nakits: yerelde build alır, Git'e commit + push yapar (Vercel bağlıysa deploy tetiklenir).
# Kullanım (nakits-next klasöründen):
#   .\scripts\deploy-push.ps1
#   .\scripts\deploy-push.ps1 -Message "İlçe filtresi ve migration"
param(
  [string] $Message = "chore: deploy"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

Write-Host ">> npm run build" -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build basarisiz; push yapilmadi." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ">> git add / commit / push" -ForegroundColor Cyan
git add -A
$status = git status --porcelain
if (-not $status) {
  Write-Host "Degisiklik yok; commit atlaniyor." -ForegroundColor Yellow
  exit 0
}
git commit -m $Message
git push

Write-Host "Tamam. Vercel'de Deployments > son job Ready olana kadar bekleyin." -ForegroundColor Green
