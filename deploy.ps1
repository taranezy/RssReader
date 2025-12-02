param([string]$SshUser = "boris", [string]$SshHost = "192.168.100.5", [string]$SshKeyPath = "$env:USERPROFILE\.ssh\id_rsa")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RSS Reader Deployment to $SshHost" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Validate files..." -ForegroundColor Yellow
if (-not ((Test-Path "docker-compose-update.yml") -and (Test-Path "rss-reader-app/Dockerfile"))) {
    Write-Host "ERROR: Missing required files" -ForegroundColor Red
    exit 1
}
Write-Host "OK: All files present" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Create archive..." -ForegroundColor Yellow
$ArchivePath = "$env:TEMP\rss-reader.tar.gz"
Remove-Item $ArchivePath -ErrorAction SilentlyContinue
tar --exclude=".git" --exclude="node_modules" --exclude=".github" --exclude="documentation" --exclude="scripts" -czf $ArchivePath . | Out-Null
Write-Host "OK: Archive created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Transfer files..." -ForegroundColor Yellow
$SshConn = "$SshUser@$SshHost"
# Create network first (required for docker-compose-update.yml)
ssh -i $SshKeyPath $SshConn "docker network create reverse-proxy 2>/dev/null || true" 2>&1 | Out-Null
ssh -i $SshKeyPath $SshConn "rm -rf ~/rss-reader; mkdir -p ~/rss-reader" 2>&1 | Out-Null
scp -i $SshKeyPath $ArchivePath "${SshConn}:~/rss-reader.tar.gz" 2>&1 | Out-Null
Write-Host "OK: Files transferred" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Extract and build..." -ForegroundColor Yellow
ssh -i $SshKeyPath $SshConn "cd ~/rss-reader && tar -xzf ~/rss-reader.tar.gz && rm ~/rss-reader.tar.gz" 2>&1 | Out-Null
ssh -i $SshKeyPath $SshConn "cd ~/rss-reader && docker build -t rss-reader:latest ./rss-reader-app --no-cache" 2>&1 | Out-Null
Write-Host "OK: Build complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Deploy container..." -ForegroundColor Yellow
ssh -i $SshKeyPath $SshConn "cd ~/rss-reader && docker-compose -f docker-compose-update.yml down --remove-orphans 2>/dev/null || true" 2>&1 | Out-Null
ssh -i $SshKeyPath $SshConn "cd ~/rss-reader && docker-compose -f docker-compose-update.yml up -d" 2>&1 | Out-Null
Write-Host "OK: Container started" -ForegroundColor Green
Write-Host ""

Remove-Item $ArchivePath -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Deployment complete!" -ForegroundColor Green
Write-Host "Access: https://streamlet.taranezy.com" -ForegroundColor Green
Write-Host ""
