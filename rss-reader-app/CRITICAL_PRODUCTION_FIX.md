# Production 401 Authentication Error - Critical Troubleshooting

## Error Description
```
Failed to load resource: the server responded with a status of 401 ()
- /api/user-settings 401
- /api/auth/user 401
```

User can login but immediately gets 401 on protected endpoints.

## Root Cause Analysis

The 401 error means the session is NOT being restored. This typically happens because:

1. **Missing `.env` file** - Without it, SESSION_SECRET and FRONTEND_URL use defaults
2. **CORS misconfiguration** - Origin mismatch prevents credentials from being accepted
3. **Cookie not being sent** - Browser may not send cookies due to security policy
4. **Session not saved** - Backend not persisting session data

## Immediate Steps

### Step 1: Create Production .env File

On your production server, create `/rss-reader-app/backend/.env`:

```bash
# CRITICAL: Set this to 'production'
NODE_ENV=production

# CRITICAL: Set to your EXACT frontend domain with protocol and port
# Examples:
#   https://taranezy.ddns.net:8444
#   https://your-domain.com
FRONTEND_URL=https://taranezy.ddns.net:8444

# CRITICAL: Generate a strong random secret
# Run locally: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Then paste the output here:
SESSION_SECRET=your-generated-random-string-here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Server config
PORT=3000
```

**⚠️ IMPORTANT:** 
- The FRONTEND_URL must match EXACTLY what's in the browser address bar
- The SESSION_SECRET must be a random string (not the default)

### Step 2: Restart Backend

After creating `.env`, restart your backend:

```bash
# Kill current process
# Then restart:
npm start

# Or if using PM2:
pm2 restart app
pm2 logs app
```

### Step 3: Check Server Logs

You should see startup output like:

```
========== SERVER STARTUP ==========
NODE_ENV: production
isProduction: true
FRONTEND_URL: https://taranezy.ddns.net:8444
CORS_ORIGINS: ["https://taranezy.ddns.net:8444"]
SESSION_SECRET: ✓ Custom
====================================

[CORS] Allowed origins: https://taranezy.ddns.net:8444
```

### Step 4: Test in Browser

1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Click login (Demo or Google)
4. Check if a session cookie appears
5. Look at Console for detailed logs

## If Still Not Working

### Check CORS Configuration

In browser Console, check if you see this message when making API calls:

```
[CORS] Rejected origin: https://your-frontend-url
[CORS] Allowed origins: https://expected-url
```

**FIX:** Make sure FRONTEND_URL in `.env` matches the Console message exactly.

### Check Session Cookie

In Browser DevTools → Application → Cookies:

**Cookie should have:**
- Name: `connect.sid` or similar
- Domain: your domain (e.g., `taranezy.ddns.net`)
- Path: `/`
- Secure: ✓ (for HTTPS)
- SameSite: `Lax`

**If NOT present:**
1. Check if login endpoint is being called: `/api/auth/demo`
2. Check Response headers for `Set-Cookie`
3. Check if CORS is allowing credentials

### Check Backend Logs

You should see logs like:

```
[Session] GET /api/auth/user:
  - SessionID: s:abc123...
  - User: demo@example.com
  - Cookies: connect.sid
```

**If User shows "none":**
- Session cookie was not sent by browser
- Check CORS_ORIGINS configuration
- Check cookie domain settings

## Complete Checklist

- [ ] `.env` file created in `backend/` directory
- [ ] `NODE_ENV=production` in `.env`
- [ ] `FRONTEND_URL` in `.env` matches exact browser URL (including protocol & port)
- [ ] `SESSION_SECRET` is a random string, not the default
- [ ] Backend restarted after `.env` creation
- [ ] Backend startup shows correct `CORS_ORIGINS`
- [ ] Session cookie appears in browser after login
- [ ] Cookie domain matches your domain
- [ ] Backend logs show user email after login (not "none")
- [ ] `/api/auth/user` endpoint returns user info (not 401)

## Files to Check

1. **backend/.env** - Must exist with correct values
2. **backend/src/services/ConfigService.js** - Reads .env file
3. **backend/src/services/AppBootstrapper.js** - Sets up CORS and sessions
4. **backend/server.js** - Logs startup config
5. **src/environments/environment.prod.ts** - Frontend uses `/api` (relative path)

## Environment Variables Required for Production

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| NODE_ENV | Set to 'production' | production | ✓ YES |
| FRONTEND_URL | Your exact frontend URL | https://taranezy.ddns.net:8444 | ✓ YES |
| SESSION_SECRET | Random session encryption key | (generate with Node) | ✓ YES |
| PORT | Backend server port | 3000 | Optional |
| GOOGLE_CLIENT_ID | OAuth client ID | (from Google Cloud) | Optional |
| GOOGLE_CLIENT_SECRET | OAuth secret | (from Google Cloud) | Optional |

## Example Working Setup

**Frontend URL in browser:** `https://taranezy.ddns.net:8444`
**Backend API calls:** `/api/*` (relative path in production)
**FRONTEND_URL in .env:** `https://taranezy.ddns.net:8444` ← Must match!
**CORS_ORIGINS:** `["https://taranezy.ddns.net:8444"]`
**Session cookie domain:** `taranezy.ddns.net`

## Still Not Working?

1. Check `/api/health` endpoint returns 200 status
2. Try demo login and check DevTools Network tab
3. Look for `Set-Cookie` response header after login
4. Verify `.env` file actually exists in `backend/` directory
5. Make sure file permissions allow Node to read `.env`
6. Try restarting the entire server (not just the app)

---

**Note:** Any change to `.env` requires backend restart to take effect!
