# Script to check and enable Redis on production server

Write-Host "=== Checking Redis on Production ===" -ForegroundColor Cyan

$sshHost = "boris@andromeda"
$rssReaderPath = "~/rss-reader"

# 1. Check if Redis is running
Write-Host "`n1. Checking if Redis container is running..." -ForegroundColor Yellow
ssh $sshHost "docker ps | grep redis"

# 2. Check if Redis container exists
Write-Host "`n2. Checking if Redis container exists..." -ForegroundColor Yellow
ssh $sshHost "docker ps -a | grep redis"

# 3. Check Docker Compose
Write-Host "`n3. Checking docker-compose.yml for Redis..." -ForegroundColor Yellow
ssh $sshHost "grep -A5 'redis:' $rssReaderPath/docker-compose.yml || echo 'Redis not in docker-compose.yml'"

# 4. Check .env file
Write-Host "`n4. Checking .env file for Redis config..." -ForegroundColor Yellow
ssh $sshHost "grep REDIS $rssReaderPath/rss-reader-app/.env || echo 'Redis config not found in .env'"

# 5. Start Redis if not running
Write-Host "`n5. Starting Redis container..." -ForegroundColor Green
ssh $sshHost "cd $rssReaderPath && docker-compose up -d redis"

# 6. Wait for Redis to start
Write-Host "`n6. Waiting for Redis to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 7. Test Redis connection
Write-Host "`n7. Testing Redis connection..." -ForegroundColor Yellow
ssh $sshHost "docker exec redis redis-cli ping"

# 8. Restart app
Write-Host "`n8. Restarting app to reconnect to Redis..." -ForegroundColor Green
ssh $sshHost "cd $rssReaderPath && docker-compose restart rss-reader"

# 9. Check health
Write-Host "`n9. Checking app health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$health = Invoke-WebRequest -Uri "https://streamlet.taranezy.com/api/health" -UseBasicParsing
Write-Host "Response:" -ForegroundColor Cyan
$health.Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n=== Done ===" -ForegroundColor Green
