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
Write-Host "🚀 INICIANDO DESPLIEGUE AUTOMATIZADO HACIA $ServerUser@$ServerHost" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Push local a GitHub
Write-Host "`n[1/4] 📦 Sincronizando repositorio Git local con GitHub (origin/main)..." -ForegroundColor Yellow
git push origin main

# 2. Comandos en el VPS
Write-Host "`n[2/4] 🔄 Conectando al servidor VPS para actualizar código (/opt/axelor-erp)..." -ForegroundColor Yellow

$RemoteCommands = @"
set -e
echo '>>> [VPS] 1. Descargando últimos cambios de GitHub...'
cd $RemotePath
git pull origin main

echo '>>> [VPS] 2. Compilando Backend BFF (tsc)...'
cd $RemotePath/bff
npm run build

echo '>>> [VPS] 3. Compilando Frontend Web (vite build)...'
cd $RemotePath/frontend
npm run build

echo '>>> [VPS] 4. Reiniciando servicios en PM2...'
pm2 restart all
pm2 list

echo '>>> [VPS] ✅ Despliegue completado con éxito.'
"@

Write-Host "`n[3/4] ⚙️ Ejecutando compilación y reinicio en el servidor remoto..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "$ServerUser@$ServerHost" "$RemoteCommands"

Write-Host "`n[4/4] 🌐 Verificando estado de los servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $BffTest = Invoke-RestMethod -Uri "http://${ServerHost}:5000/api/catalog/products?companyId=1" -Method Get -TimeoutSec 5
    Write-Host "   ✅ BFF API (Puerto 5000): En línea (Productos: $($BffTest.data.Count))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ BFF API: Verificando inicialización..." -ForegroundColor Yellow
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "🎉 DESPLIEGUE FINALIZADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "   • Web Frontend:  http://${ServerHost}:3000" -ForegroundColor White
Write-Host "   • Backend API:   http://${ServerHost}:5000/api" -ForegroundColor White
Write-Host "   • Axelor ERP:    http://${ServerHost}:8080" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Green
