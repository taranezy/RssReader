#!/usr/bin/env bash
# Pre-commit hook to prevent committing sensitive files
# Install: cp pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Checking for sensitive files..."

# Files that should never be committed
SENSITIVE_PATTERNS=(
    "\.env$"
    "\.env\.local$"
    "\.env\.production$"
    "id_rsa"
    "id_ed25519"
    "\.pem$"
    "\.key$"
    "authorized_keys"
    "\.secret$"
    "\.private$"
    "passwords\.txt"
    "credentials\.txt"
    "api-keys\.txt"
    "tokens\.txt"
    "session-secret\.txt"
    "jwt-secret\.txt"
    "client_secret.*\.json"
    "google-oauth.*\.json"
    "\.ppk$"
    "rss-reader-source-.*\.zip"
)

# Check staged files
FOUND_SENSITIVE=0
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    files=$(git diff --cached --name-only | grep -E "$pattern")
    if [ -n "$files" ]; then
        echo "❌ ERROR: Sensitive file(s) detected:"
        echo "$files" | sed 's/^/  - /'
        FOUND_SENSITIVE=1
    fi
done

# Check for common secret patterns in staged changes
SECRET_PATTERNS=(
    "GOOGLE_CLIENT_SECRET=.*[a-zA-Z0-9]"
    "SESSION_SECRET=.*[a-zA-Z0-9]"
    "JWT_SECRET=.*[a-zA-Z0-9]"
    "password.*=.*['\"][^'\"]+['\"]"
    "api_key.*=.*['\"][^'\"]+['\"]"
    "private_key.*=.*['\"][^'\"]+['\"]"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    matches=$(git diff --cached | grep -iE "$pattern" | grep -v "your-.*-here" | grep -v "example" | grep -v "SECURITY.md")
    if [ -n "$matches" ]; then
        echo "⚠️  WARNING: Possible secret found in staged changes:"
        echo "$matches" | sed 's/^/  /'
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 1 ]; then
    echo ""
    echo "🚫 COMMIT BLOCKED - Sensitive data detected!"
    echo ""
    echo "To fix:"
    echo "  1. Remove sensitive files from staging: git reset HEAD <file>"
    echo "  2. Add files to .gitignore"
    echo "  3. Use .env.example for templates instead"
    echo ""
    echo "If this is a false positive, you can skip this check with:"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ No sensitive files detected - proceeding with commit"
exit 0
