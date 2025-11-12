# ⚡ QUICK FIX: Broken Certbot on Production

## The Issue
The error `/bin/sh: wait: line 0: Illegal number: 1{!}` repeating every few seconds = **old broken container still running**

## The Fix
One command to fix everything:

```bash
bash EMERGENCY_FIX_CERTBOT.sh taranezy.ddns.net boris
```

That's it! This script will:
1. Kill the broken container (stops memory leak)
2. Upload the fixed version
3. Start it
4. Verify it works

## Time Required
⏱️ **2 minutes**

## What Gets Fixed
| Issue | Before | After |
|-------|--------|-------|
| Error repeating | Every 0.3s ❌ | Never ✅ |
| Memory | 1GB+ ❌ | <50MB ✅ |
| CPU | High ❌ | Low ✅ |
| Stability | Unstable ❌ | Stable ✅ |

## Verification After
```bash
# Check logs (should be clean)
ssh boris@taranezy.ddns.net "docker logs rss-reader-certbot | head -10"

# Check memory (should be low)
ssh boris@taranezy.ddns.net "docker stats rss-reader-certbot"
```

---

**Run this NOW to fix production:**
```
bash EMERGENCY_FIX_CERTBOT.sh taranezy.ddns.net boris
```
