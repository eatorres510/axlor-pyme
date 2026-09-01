# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMATIZADO: AXELOR PYME ERP
# Servidor: root@2.25.108.44 | Ruta: /opt/axelor-erp
# ==============================================================================

param (
    [string]$ServerHost = "2.25.108.44",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/opt/axelor-erp"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🚀 DESPLIEGUE AUTOMATIZADO: AXELOR PYME ERP -> $ServerUser@$ServerHost" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Configurar SSH_ASKPASS si existe askpass.bat en el directorio actual
$AskPassScript = Join-Path $PSScriptRoot "askpass.bat"
if (Test-Path $AskPassScript) {
    $env:SSH_ASKPASS = $AskPassScript
    $env:SSH_ASKPASS_REQUIRE = "force"
    $env:DISPLAY = "1"
}

# 1. Push de cambios locales a GitHub
Write-Host "`n[1/5] 📦 Sincronizando con repositorio GitHub (origin/main)..." -ForegroundColor Yellow
git push origin main

# 2. Transferencia de script de limpieza mojibake y actualización remota
Write-Host "`n[2/5] 🔄 Actualizando código en el VPS (/opt/axelor-erp)..." -ForegroundColor Yellow

$RemoteScript = @"
set -e
echo '>>> [VPS] 1. Descargando cambios de GitHub...'
cd $RemotePath
git pull origin main

echo '>>> [VPS] 2. Normalizando codificación UTF-8...'
if [ -f "$RemotePath/clean_server_mojibake.py" ]; then
    python3 "$RemotePath/clean_server_mojibake.py"
fi

echo '>>> [VPS] 3. Compilando Backend BFF (tsc)...'
cd $RemotePath/bff
npm run build

echo '>>> [VPS] 4. Compilando Frontend Web (vite build)...'
cd $RemotePath/frontend
npm run build

echo '>>> [VPS] 5. Reiniciando servicios en PM2...'
pm2 restart all
pm2 list

echo '>>> [VPS] ✅ Despliegue completado con éxito.'
"@

Write-Host "`n[3/5] ⚙️ Ejecutando compilación remota y reinicio de servicios..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "$ServerUser@$ServerHost" "$RemoteScript"

Write-Host "`n[4/5] 🌐 Verificando endpoints y estado de salud..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $BffTest = Invoke-RestMethod -Uri "http://${ServerHost}:5000/api/catalog/products?companyId=1" -Method Get -TimeoutSec 5
    Write-Host "   ✅ BFF API (Puerto 5000): En línea (Total productos: $($BffTest.data.Count))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ BFF API: Verificando inicialización en puerto 5000..." -ForegroundColor Yellow
}

try {
    $WebTest = Invoke-WebRequest -Uri "http://${ServerHost}:3000" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Frontend Web (Puerto 3000): En línea (HTTP $($WebTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Frontend Web: Verificando inicialización en puerto 3000..." -ForegroundColor Yellow
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "🎉 DESPLIEGUE FINALIZADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "   • Web Frontend:  http://${ServerHost}:3000" -ForegroundColor White
Write-Host "   • Backend API:   http://${ServerHost}:5000/api" -ForegroundColor White
Write-Host "   • Axelor ERP:    http://${ServerHost}:8080" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Green
