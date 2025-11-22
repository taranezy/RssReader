# Production Authentication Fix Guide

## Issue
On production, users get 401 errors on `/api/auth/user` and `/api/user-settings` endpoints even after successful login.

**Error:**
```
Failed to load resource: the server responded with a status of 401 ()
```

## Root Cause
Session cookies are not being properly stored or sent between frontend and backend requests due to:
1. Missing or incorrect `.env` file configuration
2. CORS not properly configured for credentials
3. Cookie configuration not matching production HTTPS requirements

## Solution

### Step 1: Create `.env` File on Production Server

Create `rss-reader-app/backend/.env` with the following:

```bash
# REQUIRED FOR PRODUCTION
NODE_ENV=production

# Set to your production domain with protocol and port
FRONTEND_URL=https://taranezy.ddns.net:8444

# Generate a random session secret:
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=<your-generated-random-string>

# Google OAuth (if using OAuth login)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=https://taranezy.ddns.net:8444/api/auth/google/callback

# Server
PORT=3000
```

### Step 2: Verify CORS Configuration

The backend now automatically:
- Sets CORS origin from `FRONTEND_URL` environment variable on production
- Enables credentials for all CORS requests
- Allows cookies to be sent with cross-origin requests

### Step 3: Verify Session Cookie Configuration

Session cookies are configured to work on production HTTPS:
- `secure: true` - Only sent over HTTPS
- `sameSite: 'lax'` - Sent on same-site requests (same domain)
- `httpOnly: false` - Allows JavaScript access (needed for app)
- `path: '/'` - Sent to all paths

### Step 4: Frontend Configuration

The frontend `environment.prod.ts` uses:
```typescript
apiUrl: '/api'  // Relative path - works with any domain
```

This ensures frontend correctly targets the backend API on the same domain.

### Step 5: Restart Backend Service

After creating the `.env` file, restart the backend:

```bash
# Stop the current process
# Then restart with:
npm start
# Or if using PM2:
pm2 restart app
```

## Debugging

### Check If Session Cookie Is Being Set

After login, check browser DevTools:

1. **Network Tab**: 
   - Look for `/api/auth/demo` or `/api/auth/login` response
   - Should have `Set-Cookie` header with session cookie

2. **Application Tab → Cookies**:
   - Domain: should match your production domain
   - Path: `/`
   - Secure: checked (HTTPS only)
   - HttpOnly: unchecked (our app needs JS access)

### Check Backend Logs

The backend now logs session information:

```
[Session] GET /api/auth/user:
  - SessionID: <session-id>
  - User: <user-email>
  - Cookies: <cookie-names>
```

If User shows "none", the session isn't being restored.

### Common Issues

| Issue | Solution |
|-------|----------|
| Session cookie not set | Check FRONTEND_URL matches exact domain + port in .env |
| Session cookie not sent | Ensure browser security allows cookies (check console errors) |
| Session not restored | Check SESSION_SECRET consistency (restart backend after .env change) |
| 401 on protected routes | Session cookie not being sent - check withCredentials in frontend |

## Files Modified

1. **ConfigService.js**: CORS origin now uses FRONTEND_URL from .env
2. **AppBootstrapper.js**: Session cookie configured for production HTTPS + debug logging
3. **AuthController.js**: Added debug logging for session/user info
4. **.env.example**: Updated with production setup instructions

## Testing Login Flow

1. Navigate to production domain
2. Click "Demo" or login with Google
3. Check browser DevTools Console for logs
4. Check backend logs for session information
5. Verify `/api/auth/user` returns current user (should show in console)

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| NODE_ENV | Set to 'production' to enable production mode | production |
| FRONTEND_URL | Frontend domain (must match exactly) | https://taranezy.ddns.net:8444 |
| SESSION_SECRET | Random string to encrypt sessions | (generated random hex) |
| PORT | Backend server port | 3000 |
| GOOGLE_CLIENT_ID | OAuth client ID | (from Google Cloud) |
| GOOGLE_CLIENT_SECRET | OAuth client secret | (from Google Cloud) |
| GOOGLE_CALLBACK_URL | OAuth callback URL | https://taranezy.ddns.net:8444/api/auth/google/callback |

---

**Note:** After any changes to `.env`, you must restart the backend server for changes to take effect.
