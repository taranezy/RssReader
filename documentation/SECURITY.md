# Security & Sensitive Files - Important Information

## 🔒 Files That Are NOT Committed to Repository

The following sensitive files are automatically excluded from version control via `.gitignore`:

### Environment & Configuration Files
- `.env` - Production environment variables
- `.env.local` - Local development overrides
- `.env.production` - Production-specific settings
- `backend/.env` - Backend environment configuration
- Any files matching `*.secret`, `*.private`

### SSH Keys & Credentials
- `id_rsa`, `id_rsa.pub` - SSH private/public keys
- `id_ed25519`, `id_ed25519.pub` - Ed25519 SSH keys
- `authorized_keys` - SSH authorized keys
- `known_hosts` - SSH known hosts
- `.ssh/` directory - All SSH configuration
- `*.pem`, `*.key`, `*.crt` - SSL/TLS certificates
- `*.ppk` - PuTTY private keys

### OAuth & API Credentials
- `google-oauth-*.json` - Google OAuth credentials
- `client_secret*.json` - OAuth client secrets
- `credentials.json` - API credentials
- `api-keys.txt` - API key storage
- `tokens.txt` - Authentication tokens

### Database Files
- `backend/data/*.db` - SQLite databases
- `backend/data/*.db-journal` - SQLite journal files

### Deployment Artifacts
- `rss-reader-source-*.zip` - Deployment archives
- `*.tar.gz` - Docker/deployment packages
- `*.tmp`, `*.temp` - Temporary files

### Session & Security Secrets
- `session-secret.txt` - Express session secrets
- `jwt-secret.txt` - JWT signing keys
- `passwords.txt` - Password storage
- `credentials.txt` - Credential storage

### Log Files
- `*.log` - All log files (may contain sensitive data)
- `logs/` - Log directories
- `npm-debug.log*`, `yarn-error.log*` - Package manager logs

## ⚙️ Setup Instructions

### First Time Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets:**
   ```bash
   # Generate SESSION_SECRET
   node -e "require('crypto').randomBytes(32).toString('hex')"
   
   # Generate JWT_SECRET
   node -e "require('crypto').randomBytes(32).toString('hex')"
   ```

3. **Configure Google OAuth:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs
   - Copy Client ID and Client Secret to `.env`

4. **Update `.env` file:**
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-secret
   SESSION_SECRET=your-generated-session-secret
   JWT_SECRET=your-generated-jwt-secret
   ```

### SSH Key Setup (For Passwordless Deployment)

Run the automated setup:
```bash
npm run setup:ssh
```

This will:
- Generate SSH keys (if needed)
- Install public key on Andromeda server
- Enable passwordless deployment

**Important:** SSH keys are stored locally in `~/.ssh/` and are automatically ignored by git.

## ⚠️ Security Best Practices

### DO NOT:
❌ Commit `.env` files to git
❌ Share SSH private keys
❌ Include secrets in code or config files
❌ Push credentials to public repositories
❌ Store passwords in plain text files
❌ Commit database files with user data

### DO:
✅ Use `.env.example` as a template
✅ Generate unique secrets for each environment
✅ Keep SSH keys secure and private
✅ Use strong, random session secrets
✅ Rotate secrets periodically
✅ Use environment variables for sensitive data
✅ Review `.gitignore` before committing

## 🔍 Checking for Exposed Secrets

Before committing, verify no secrets are staged:

```bash
# Check what files are staged
git status

# Review staged changes
git diff --cached

# Check for accidentally added secrets
git diff --cached | grep -i "secret\|password\|key\|token"
```

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate the compromised credentials**
2. **Remove from git history:**
   ```bash
   # Remove file from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret-file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push to remote (WARNING: rewrites history)
   git push origin --force --all
   ```
3. **Update all instances with new credentials**
4. **Add the file pattern to `.gitignore`**

## 📋 Deployment Checklist

Before deploying to production:

- [ ] All `.env` files are configured
- [ ] Secrets are strong and unique
- [ ] SSH keys are set up (for automated deployment)
- [ ] Google OAuth redirect URIs are updated
- [ ] Database path is correct
- [ ] No sensitive files in git staging area
- [ ] `.gitignore` is up to date
- [ ] Secrets are not in docker-compose.yml or Dockerfile

## 📝 Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_CheatSheet.html)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Last Updated:** November 4, 2025
