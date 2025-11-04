# SSH Key Setup for Andromeda
# This script will help you set up passwordless SSH authentication

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SSH Key Setup for Andromeda Server" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if SSH key exists
$sshDir = "$env:USERPROFILE\.ssh"
$keyFile = "$sshDir\id_rsa"
$pubKeyFile = "$sshDir\id_rsa.pub"

if (-not (Test-Path $sshDir)) {
    Write-Host "[SETUP] Creating .ssh directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

if (Test-Path $keyFile) {
    Write-Host "[INFO] SSH key already exists at $keyFile" -ForegroundColor Green
    Write-Host "[INFO] Public key: $pubKeyFile" -ForegroundColor Green
} else {
    Write-Host "[GENERATE] No SSH key found. Generating new SSH key pair..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Enter when prompted (leave passphrase empty for passwordless access)" -ForegroundColor Cyan
    Write-Host ""
    
    ssh-keygen -t rsa -b 4096 -f $keyFile -C "$env:USERNAME@$(hostname)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to generate SSH key" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[SUCCESS] SSH key generated successfully!" -ForegroundColor Green
}

# Step 2: Display public key
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Your SSH Public Key:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Get-Content $pubKeyFile
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Copy key to Andromeda
$remoteServer = "andromeda"
$remoteUser = $env:USERNAME

Write-Host "[COPY] Attempting to copy SSH key to $remoteServer..." -ForegroundColor Yellow
Write-Host "[NOTE] You will need to enter your password ONE MORE TIME" -ForegroundColor Cyan
Write-Host ""

# Read the public key
$publicKey = Get-Content $pubKeyFile

# Create the command to add the key
$command = @"
mkdir -p ~/.ssh && \
chmod 700 ~/.ssh && \
echo '$publicKey' >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/authorized_keys && \
echo 'SSH key added successfully!'
"@

Write-Host "[EXEC] Running remote command to install key..." -ForegroundColor Gray
ssh -4 "${remoteUser}@${remoteServer}" $command

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "SUCCESS! SSH Key Setup Complete" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now connect to Andromeda without a password!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Testing connection..." -ForegroundColor Yellow
    Write-Host ""
    
    # Test the connection
    ssh -4 "${remoteUser}@${remoteServer}" "echo 'Connection successful! No password required.'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Passwordless authentication is working!" -ForegroundColor Green
        Write-Host "[INFO] You can now run 'npm run deploy:remote' without entering a password" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to copy SSH key to remote server" -ForegroundColor Red
    Write-Host "[MANUAL] You can manually add the key by:" -ForegroundColor Yellow
    Write-Host "  1. Copy the public key above" -ForegroundColor Yellow
    Write-Host "  2. SSH to andromeda: ssh $remoteUser@$remoteServer" -ForegroundColor Yellow
    Write-Host "  3. Run: mkdir -p ~/.ssh && echo 'PASTE_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Yellow
    Write-Host "  4. Run: chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
