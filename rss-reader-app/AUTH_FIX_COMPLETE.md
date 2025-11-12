# Production Authentication - Complete Fix Package

## Problem
Users cannot login on production. They get 401 errors on `/api/auth/user` and `/api/user-settings` even after successful login attempt.

## Root Cause
**Missing `.env` file on production server** causing:
1. SESSION_SECRET uses insecure default
2. FRONTEND_URL not configured correctly
3. CORS origins not matching frontend domain
4. Sessions not properly encrypted/stored

## Solution Overview

The backend now:
1. ✓ Reads configuration from `.env` file
2. ✓ Validates CORS origins against configured FRONTEND_URL
3. ✓ Logs startup configuration for verification
4. ✓ Logs CORS validation decisions
5. ✓ Logs session information on each request
6. ✓ Provides verification script to test setup

## Implementation Changes

### 1. ConfigService.js
**Change:** Improved CORS origin configuration
- Reads FRONTEND_URL from `.env`
- Defaults to common production domains if not set
- Better comments explaining each mode

**Code:**
```javascript
if (this.isProduction) {
  const frontendUrl = process.env.FRONTEND_URL;
  this.CORS_ORIGINS = frontendUrl 
    ? [frontendUrl]
    : ['https://taranezy.ddns.net:8444', 'https://taranezy.ddns.net', ...];
}
```

### 2. AppBootstrapper.js
**Change:** Dynamic CORS validation with detailed logging
- Custom CORS origin function that validates each request
- Logs allowed vs rejected origins
- Better error messages for debugging

**Features:**
- Logs which origins are allowed on startup
- Warns when requests come from unknown origins
- Helps identify misconfiguration immediately

### 3. AuthController.js
**Change:** Enhanced session debugging
- Logs SessionID on each /api/auth/user request
- Shows current user or "none" if not authenticated
- Lists available cookies

**Output:**
```
[AuthController.getCurrentUser] Session ID: s:abc123...
[AuthController.getCurrentUser] User: demo@example.com
[AuthController.getCurrentUser] Cookies: connect.sid
```

### 4. server.js
**Change:** Startup configuration verification
- Displays all critical config on startup
- Shows whether SESSION_SECRET is custom or default
- Makes misconfiguration immediately obvious

**Output:**
```
========== SERVER STARTUP ==========
NODE_ENV: production
isProduction: true
FRONTEND_URL: https://taranezy.ddns.net:8444
CORS_ORIGINS: ["https://taranezy.ddns.net:8444"]
SESSION_SECRET: ✓ Custom
====================================
```

### 5. verify-auth-setup.js
**New file:** Production verification script
- Checks .env file exists
- Validates all required variables
- Tests ConfigService loads correctly
- Verifies database file
- Confirms environment type

**Usage:**
```bash
node backend/verify-auth-setup.js
```

## What You Must Do

### Step 1: Create .env File

On production server, create `rss-reader-app/backend/.env`:

```bash
# CRITICAL - Set to production mode
NODE_ENV=production

# CRITICAL - Must match EXACTLY what's in browser address bar
FRONTEND_URL=https://taranezy.ddns.net:8444

# CRITICAL - Generate strong random secret
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=abc123def456...

# Optional - Google OAuth
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

PORT=3000
```

### Step 2: Verify Setup

```bash
cd rss-reader-app/backend
node verify-auth-setup.js
```

Should show all checks passing.

### Step 3: Restart Backend

```bash
# Kill current process and restart
npm start
# Or with PM2:
pm2 restart app
pm2 logs app
```

Check logs show:
- `CORS_ORIGINS: ["https://taranezy.ddns.net:8444"]`
- `SESSION_SECRET: ✓ Custom`

### Step 4: Test Login

1. Open browser to `https://taranezy.ddns.net:8444`
2. Open DevTools (F12)
3. Click Demo Login
4. Check Application → Cookies for `connect.sid`
5. Check Console for logs
6. Verify `/api/auth/user` returns user info (not 401)

## Documentation Files

1. **CRITICAL_PRODUCTION_FIX.md** - Emergency troubleshooting guide
2. **PRODUCTION_AUTH_FIX.md** - Detailed authentication setup
3. **verify-auth-setup.js** - Automated verification script
4. **.env.example** - Template for environment configuration

## Key Configuration Requirements

| Setting | Must | Must Match |
|---------|------|-----------|
| NODE_ENV | production | Exactly |
| FRONTEND_URL | https://taranezy.ddns.net:8444 | Browser address bar |
| SESSION_SECRET | Random strong string | Must be generated |
| CORS_ORIGINS | Derived from FRONTEND_URL | Frontend domain |

## Debugging Checklist

If still getting 401 after following steps:

- [ ] .env file exists in backend directory
- [ ] NODE_ENV=production in .env
- [ ] FRONTEND_URL matches browser address exactly (including protocol & port)
- [ ] SESSION_SECRET is a long random string
- [ ] Backend restarted after .env creation
- [ ] /api/health endpoint returns 200
- [ ] Session cookie appears in browser after login
- [ ] Backend logs show user email (not "none")
- [ ] CORS logs don't show "Rejected origin"

## How It Works Now

1. **Frontend makes request** → Browser sends cookies (withCredentials: true)
2. **CORS middleware** → Checks if origin is in allowed list
3. **If origin allowed** → Passes request through, sets CORS headers
4. **Session middleware** → Reads connect.sid cookie
5. **Passport middleware** → Deserializes user from session
6. **Route handler** → req.user now contains user info
7. **Response** → Returns authenticated data or 401 if no session

## Common Issues & Fixes

### Issue: CORS Rejected Origin
**Cause:** FRONTEND_URL doesn't match browser URL
**Fix:** Update FRONTEND_URL in .env to exact domain:port

### Issue: Session Cookie Not Set
**Cause:** CORS not allowing credentials
**Fix:** Verify CORS_ORIGINS includes your domain

### Issue: Session Not Restored
**Cause:** SESSION_SECRET changed or mismatch
**Fix:** Ensure same SESSION_SECRET in .env, restart backend

### Issue: Still 401 After Login
**Cause:** Multiple issues possible
**Fix:** Run verify-auth-setup.js, check backend logs

## Files Modified

- ✓ backend/src/services/ConfigService.js
- ✓ backend/src/services/AppBootstrapper.js  
- ✓ backend/src/controllers/AuthController.js
- ✓ backend/server.js
- ✓ backend/.env.example
- ✓ CREATED: backend/verify-auth-setup.js
- ✓ CREATED: CRITICAL_PRODUCTION_FIX.md
- ✓ CREATED: PRODUCTION_AUTH_FIX.md

---

**Status:** Ready for production deployment

**Next Action:** Create `.env` file with correct values and restart backend
