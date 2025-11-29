# Enable Redis in Production
# This script adds Redis configuration to the production .env file

param(
    [string]$Server = "boris@andromeda",
    [string]$AppPath = "~/rss-reader/rss-reader-app"
)

Write-Host "🔧 Enabling Redis on Production Server..." -ForegroundColor Cyan

# Check if Redis config already exists
Write-Host "Checking production .env file..." -ForegroundColor Yellow
$checkRedis = ssh $Server "grep -c 'REDIS_HOST' $AppPath/.env || echo 0"

if ($checkRedis -eq "1") {
    Write-Host "✅ Redis configuration already exists in production .env" -ForegroundColor Green
    exit 0
}

# Add Redis configuration to production .env
Write-Host "Adding Redis configuration..." -ForegroundColor Yellow
ssh $Server "cat >> $AppPath/.env << 'EOF'

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
EOF"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis configuration added to production .env" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add Redis configuration" -ForegroundColor Red
    exit 1
}

# Restart the app
Write-Host "Restarting application..." -ForegroundColor Yellow
ssh $Server "cd $AppPath && docker-compose down && docker-compose up -d --build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application restarted successfully" -ForegroundColor Green
    Start-Sleep -Seconds 10
    Write-Host "Checking Redis status..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "https://streamlet.taranezy.com:8444/api/health" -SkipCertificateCheck
    $health = $response.Content | ConvertFrom-Json
    
    if ($health.redis.enabled) {
        Write-Host "✅ Redis is now ENABLED and CONNECTED!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis is still disabled. Check logs:" -ForegroundColor Yellow
        Write-Host "ssh $Server 'cd $AppPath && docker-compose logs rss-reader | tail -50'" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Failed to restart application" -ForegroundColor Red
    exit 1
}
