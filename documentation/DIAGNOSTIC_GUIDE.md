# Quick Diagnostic: Check What's Being Injected

## Test This in Your Browser Console (Right Now)

Open your website in a browser and paste this into the DevTools Console:

```javascript
// Check everything that should be injected
('%c=== STREAMLET AUTH DEBUG ===', 'color: blue; font-size: 14px; font-weight: bold;');

('localStorage:', {
  email: localStorage.getItem('streamlet_email'),
  token: localStorage.getItem('streamlet_id_token'),
  authenticated: localStorage.getItem('streamlet_authenticated'),
  skipLogin: localStorage.getItem('streamlet_skip_login'),
  nativeApp: localStorage.getItem('streamlet_native_app'),
});

('window globals:', {
  authenticated: window.streamletAuthenticated,
  email: window.streamletEmail,
});

('URL params:', {
  skipLogin: new URLSearchParams(window.location.search).get('skip_login'),
  nativeApp: new URLSearchParams(window.location.search).get('native_app'),
});
```

---

## The Problem

**Option 1: Data IS being injected, but website ignores it**
→ Website code is not checking for it
→ Website needs to implement detection

**Option 2: Data is NOT being injected**
→ Android app is not passing credentials properly
→ Check Android logs: `adb logcat | grep Streamlet`

---

## Solution: Add This to Your Website

### Step 1: Add Detection to Your AppComponent

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit() {
    
    // Check if native app authentication is available
    const skipLogin = localStorage.getItem('streamlet_skip_login');
    const token = localStorage.getItem('streamlet_id_token');
    const email = localStorage.getItem('streamlet_email');
    
    
    if (skipLogin === 'true' && token) {
      // Skip login page - go directly to main content
      this.router.navigate(['/feeds']); // or wherever your main page is
      return;
    }
    
    // Otherwise show login normally
  }
}
```

### Step 2: Test It

1. **Close app completely**
2. **Clear app data:**
   ```bash
   adb shell pm clear com.streamlet.app
   ```
3. **Reopen app**
4. **Sign in with Google**
5. **Check browser DevTools Console:**
   - Look for `[Streamlet]` logs
   - See if it says "Native app detected"

---

## Troubleshooting

### If localStorage is EMPTY

**Problem:** Auth data not being injected by app
**Solution:** Check Android logs

```bash
adb logcat | grep "MainActivity\|Streamlet"
```

Look for:
```
D MainActivity: Injecting auth data on page start for: user@example.com
D MainActivity: Page started loading: https://taranezy.ddns.net:8444
```

If you DON'T see these logs, the Android app isn't properly passing credentials.

### If localStorage HAS DATA but login page shows anyway

**Problem:** Website code is not checking localStorage
**Solution:** Add the AppComponent code above

### If You See This in Console

```
[Streamlet] AppComponent initializing...
[Streamlet] Auth check: { skipLogin: 'true', hasToken: true, email: 'user@example.com' }
[Streamlet] ✓ Native app detected! Skipping login...
```

**Perfect!** Everything is working. Make sure the router.navigate() path is correct.

---

## Direct Question to Help Debug

Tell me:

1. **When you open the app, do you see any `[Streamlet]` logs in the browser console?**
   - YES → Website code not implemented
   - NO → Android app not injecting data

2. **What is your main/feed page route?**
   - We need to know what path to navigate to after login
   - Example: `/feeds`, `/home`, `/dashboard`

3. **Do you have an existing login guard/route?**
   - We might need to bypass it for native auth

Once you answer these, I can help you fix it specifically.
