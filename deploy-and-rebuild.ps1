# Complete Deployment: Build + Deploy + Rebuild Docker
# Usage: npm run deploy:full

$DEPLOY_HOST = "andromeda"
$DEPLOY_USER = "boris"
$PRODUCTION_FOLDER = "/home/boris/rss-reader"
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa"
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONTEND_FOLDER = "$PROJECT_ROOT\rss-reader-app"

function Write-Success($msg) {
    Write-Host "SUCCESS: $msg" -ForegroundColor Green
}

function Write-ErrorMsg($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
}

function Write-InfoMsg($msg) {
    Write-Host "INFO: $msg" -ForegroundColor Cyan
}

# Step 1: Build Frontend
Write-InfoMsg "======================================"
Write-InfoMsg "STEP 1: Building Angular Frontend"
Write-InfoMsg "======================================"

Set-Location $FRONTEND_FOLDER
Write-InfoMsg "Working directory: $(Get-Location)"
Write-InfoMsg "Running: npm run build"

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Frontend build FAILED"
    exit 1
}
Write-Success "Frontend build completed"

# Step 2: Deploy Files to Production
Write-InfoMsg ""
Write-InfoMsg "======================================"
Write-InfoMsg "STEP 2: Deploying Files to Production"
Write-InfoMsg "======================================"

Write-InfoMsg "Running: npm run deploy:remote"
npm run deploy:remote
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Deployment FAILED"
    exit 1
}
Write-Success "Files deployed to production server"

# Step 3: Rebuild Docker on Production
Write-InfoMsg ""
Write-InfoMsg "======================================"
Write-InfoMsg "STEP 3: Rebuilding Docker on Production"
Write-InfoMsg "======================================"

Write-InfoMsg "Connecting to production server: $DEPLOY_HOST"
Write-InfoMsg "Running Docker commands..."

# Run each command separately to avoid line-ending issues
Write-InfoMsg "Stopping old containers..."
ssh $DEPLOY_HOST "cd $PRODUCTION_FOLDER && docker-compose -f docker-compose.prod.yml stop" 2>&1 | Out-Null

Write-InfoMsg "Removing old containers..."
ssh $DEPLOY_HOST "cd $PRODUCTION_FOLDER && docker-compose -f docker-compose.prod.yml rm -f" 2>&1 | Out-Null

Write-InfoMsg "Building new Docker image..."
ssh $DEPLOY_HOST "cd $PRODUCTION_FOLDER && docker-compose -f docker-compose.prod.yml build --no-cache"
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Docker build FAILED"
    exit 1
}

Write-InfoMsg "Starting new containers..."
ssh $DEPLOY_HOST "cd $PRODUCTION_FOLDER && docker-compose -f docker-compose.prod.yml up -d"
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Docker start FAILED"
    exit 1
}

Write-InfoMsg "Waiting for containers to start..."
Start-Sleep -Seconds 3

Write-InfoMsg "Checking container status..."
ssh $DEPLOY_HOST "cd $PRODUCTION_FOLDER && docker-compose -f docker-compose.prod.yml ps"

Write-Success "Docker rebuild completed"
Write-Success "Docker rebuild completed"

# Final Summary
Write-InfoMsg ""
Write-InfoMsg "======================================"
Write-Success "DEPLOYMENT COMPLETE"
Write-InfoMsg "======================================"
Write-Success "Summary:"
Write-Success "  - Frontend built locally"
Write-Success "  - Files deployed to production"
Write-Success "  - Docker image rebuilt"
Write-Success "  - Containers restarted"
Write-InfoMsg ""
Write-InfoMsg "Changes should be visible at:"
Write-InfoMsg "  https://$DEPLOY_HOST`:8444"
Write-InfoMsg ""
Write-InfoMsg "Wait 10-15 seconds and hard refresh Ctrl+Shift+R"
Write-Success "Done!"
