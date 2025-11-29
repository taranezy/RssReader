# PowerShell deployment script - Remote Build Version
# Builds Docker image on Andromeda server instead of locally
# Use this when Docker is not available on local Windows machine

param(
    [string]$RemoteServer = "andromeda",
    [string]$RemoteUser = $env:USERNAME,
    [string]$RemotePath = "~/rss-reader"  # Changed to home directory to avoid permission issues
)

$ErrorActionPreference = "Stop"

Write-Host "[DEPLOY] Starting remote deployment to $RemoteServer..." -ForegroundColor Green
Write-Host "[INFO] Building on remote server (no local Docker required)" -ForegroundColor Cyan

# Step 1: Create remote directory
Write-Host "[REMOTE] Creating deployment directory on $RemoteServer..." -ForegroundColor Cyan
ssh -4 "${RemoteUser}@${RemoteServer}" "mkdir -p $RemotePath"

# Step 2: Upload project files
Write-Host "[UPLOAD] Uploading project files to $RemoteServer..." -ForegroundColor Cyan

# Create temporary archive of project files
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TempArchive = "rss-reader-source-$Timestamp.zip"

Write-Host "[ARCHIVE] Creating source archive..." -ForegroundColor Gray

# Use PowerShell to create zip (excluding node_modules, etc.)
$exclude = @(
    "node_modules",
    ".angular",
    "dist",
    ".git",
    "*.log",
    "backend/data/*.db"
)

# Create a temporary directory with files to upload
$tempDir = Join-Path $env:TEMP "rss-reader-deploy-$Timestamp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy necessary files
Write-Host "[COPY] Copying project files..." -ForegroundColor Gray
$filesToCopy = @(
    "src",
    "backend",
    "public",
    "package.json",
    "package-lock.json",
    "angular.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    ".dockerignore",
    "../nginx"  # Add nginx config directory
    # Note: .env is NOT copied to avoid overwriting production configuration
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        if ($item -eq "backend") {
            # Copy backend directory but exclude node_modules
            Write-Host "  - Copying backend (excluding node_modules)..." -ForegroundColor DarkGray
            New-Item -ItemType Directory -Path "$tempDir\backend" -Force | Out-Null
            
            # Copy backend files individually to exclude node_modules
            Get-ChildItem -Path "backend" -Exclude "node_modules" | ForEach-Object {
                Copy-Item -Path $_.FullName -Destination "$tempDir\backend\" -Recurse -Force
            }
        } elseif ($item -eq "../nginx") {
            # Copy nginx directory
            Write-Host "  - Copying nginx configuration..." -ForegroundColor DarkGray
            Copy-Item -Path "../nginx" -Destination "$tempDir\" -Recurse -Force
        } else {
            Copy-Item -Path $item -Destination $tempDir -Recurse -Force
        }
    }
}

# Create zip archive
Compress-Archive -Path "$tempDir\*" -DestinationPath $TempArchive -Force

# Upload archive
Write-Host "[UPLOAD] Transferring archive to $RemoteServer..." -ForegroundColor Cyan
scp -4 $TempArchive "${RemoteUser}@${RemoteServer}:${RemotePath}/"

# Step 3: Build and deploy on remote server
Write-Host "[BUILD] Building Docker image on $RemoteServer..." -ForegroundColor Cyan

# Create a temporary script file with LF line endings
$scriptContent = @"
#!/bin/bash
set -e
cd $RemotePath

echo '[EXTRACT] Extracting project files...'
unzip -o $TempArchive
rm $TempArchive

echo '[ENV] Checking environment configuration...'
# Create .env from example if it doesn't exist (first deployment)
if [ ! -f .env ]; then
  echo 'Creating .env from backend/.env.example...'
  cp backend/.env.example .env
  echo '⚠️  WARNING: Please configure .env file with production values!'
else
  echo '.env file exists, keeping production configuration'
fi

echo '[CLEANUP] Cleaning up old node_modules and fixing permissions...'
# Remove any old node_modules that might exist
find . -type d -name "node_modules" -prune -exec rm -rf {} + 2>/dev/null || true
# Fix permissions on extracted files
chmod -R u+rwX . 2>/dev/null || true

echo '[BUILD] Building Docker image...'
docker-compose -f docker-compose.prod.yml build --no-cache

echo '[STOP] Stopping old container...'
docker-compose -f docker-compose.prod.yml down || true

echo '[START] Starting new container...'
docker-compose -f docker-compose.prod.yml up -d

echo '[STATUS] Container status:'
docker-compose -f docker-compose.prod.yml ps

echo '[LOGS] Recent logs:'
docker-compose -f docker-compose.prod.yml logs --tail=20

echo '[HEALTH] Checking application health...'
sleep 5
curl -f http://localhost:3000/api/health || echo 'Health check failed (application may still be starting)'

echo '[COMPLETE] Deployment finished successfully!'
"@

# Save script with Unix line endings
$scriptPath = Join-Path $tempDir "deploy.sh"
$scriptContent -replace "`r`n", "`n" | Set-Content -Path $scriptPath -NoNewline -Encoding UTF8

# Upload script
scp -4 $scriptPath "${RemoteUser}@${RemoteServer}:${RemotePath}/deploy.sh"

# Execute script
ssh -4 "${RemoteUser}@${RemoteServer}" "cd $RemotePath && chmod +x deploy.sh && ./deploy.sh"

# Step 4: Clean up local temporary files
Write-Host "[CLEANUP] Cleaning up local files..." -ForegroundColor Cyan
Remove-Item $TempArchive -Force
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "[SUCCESS] Deployment complete!" -ForegroundColor Green
Write-Host "[INFO] Application should be running at http://${RemoteServer}:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check status: ssh ${RemoteUser}@${RemoteServer} 'cd $RemotePath && docker-compose ps'" -ForegroundColor Gray
Write-Host "  2. View logs: ssh ${RemoteUser}@${RemoteServer} 'cd $RemotePath && docker-compose logs -f'" -ForegroundColor Gray
Write-Host "  3. Access app: http://${RemoteServer}:3000" -ForegroundColor Gray
Write-Host ""
