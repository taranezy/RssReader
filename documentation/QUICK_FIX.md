# Production Login Fix - Quick Reference

## The One Essential File

Create `rss-reader-app/backend/.env` on production server:

```bash
NODE_ENV=production
FRONTEND_URL=https://taranezy.ddns.net:8444
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

**Get SESSION_SECRET by running:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Critical Points

1. **FRONTEND_URL must match browser address exactly** (protocol + domain + port)
2. **SESSION_SECRET must be a random string, not default**
3. **Backend must be restarted after creating .env**

## Verification

```bash
# Check setup is correct
cd rss-reader-app/backend
node verify-auth-setup.js

# Restart backend
npm start

# Check logs show:
# NODE_ENV: production
# CORS_ORIGINS: ["https://taranezy.ddns.net:8444"]
# SESSION_SECRET: ✓ Custom
```

## Test Login

1. Open `https://taranezy.ddns.net:8444`
2. F12 → Network tab → click Demo Login
3. Check `/api/auth/demo` response for `Set-Cookie` header
4. F12 → Application → Cookies → should see `connect.sid`
5. Open `https://taranezy.ddns.net:8444/api/auth/user` → should return user JSON, not 401

## If Still Getting 401

1. Check FRONTEND_URL in .env matches browser address EXACTLY
2. Check backend logs show correct CORS_ORIGINS
3. Check /api/health returns 200
4. Check Session logs show user email (not "none")
5. Read CRITICAL_PRODUCTION_FIX.md for detailed troubleshooting

---

That's it! Just create the .env file with correct values and restart.
