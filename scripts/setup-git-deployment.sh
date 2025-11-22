#!/bin/bash
# setup-git-deployment.sh
# Run this script after cloning to set up your deployment environment

set -e

echo "========================================="
echo "RSS Reader - Git Deployment Setup"
echo "========================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "Step 1: Creating .env from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "IMPORTANT: Edit .env now with your production values:"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - SESSION_SECRET (run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo ""
    echo "Command to edit:"
    echo "  nano .env"
    echo ""
    exit 1
else
    echo "✓ .env file already exists"
fi

# Verify required environment variables
echo ""
echo "Step 2: Verifying environment variables..."
required_vars=("GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "SESSION_SECRET")

for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env; then
        value=$(grep "^$var=" .env | cut -d'=' -f2)
        if [ -z "$value" ] || [ "$value" = "your-secret-key-change-in-production" ] || [ "$value" = "your-google-client-id-here" ] || [ "$value" = "your-google-client-secret-here" ]; then
            echo "✗ $var is not set or is using placeholder value"
            echo "  Edit .env and set real values"
            exit 1
        else
            echo "✓ $var is set"
        fi
    else
        echo "✗ $var not found in .env"
        exit 1
    fi
done

echo ""
echo "Step 3: Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found. Please install Docker."
    exit 1
fi
echo "✓ Docker is installed"

echo ""
echo "Step 4: Git configuration..."
echo "✓ Checking .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo "✓ .env is properly ignored in git"
else
    echo "✗ .env is not in .gitignore"
    exit 1
fi

echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Verify .env has all values:"
echo "   cat .env"
echo ""
echo "2. Build and run:"
echo "   docker-compose up -d --build"
echo ""
echo "3. Check services:"
echo "   docker ps | grep rss"
echo ""
echo "4. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "For more details, see GIT_DEPLOYMENT.md"
