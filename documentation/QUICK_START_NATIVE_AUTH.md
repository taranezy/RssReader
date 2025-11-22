# Quick Start: Native Auth Implementation

## For Website Developers

### 1. Minimum Implementation (Copy-Paste Ready)

```typescript
// In your AppComponent or main routing guard
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // Check if native app authentication
    const shouldSkipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
    const idToken = localStorage.getItem('streamlet_id_token');
    
    if (shouldSkipLogin && idToken) {
      this.router.navigate(['/home']);
    }
  }
}
```

### 2. Add to Your HTTP Interceptor

```typescript
// auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('streamlet_id_token');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}
```

### 3. Add Interceptor to Providers

```typescript
// app.module.ts
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  providers: [
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptor, 
      multi: true 
    }
  ]
})
export class AppModule {}
```

---

## What Gets Injected

| When | What | Where |
|------|------|-------|
| **Early** (before page renders) | localStorage keys + window globals | `onPageStarted()` |
| **After page loads** | Custom event | `onPageFinished()` |
| **URL** | Query parameters | `?skip_login=true&native_app=true` |

### localStorage Keys Set

```javascript
localStorage.setItem('streamlet_email', 'user@example.com');
localStorage.setItem('streamlet_id_token', 'eyJhbGc...');
localStorage.setItem('streamlet_authenticated', 'true');
localStorage.setItem('streamlet_skip_login', 'true');
localStorage.setItem('streamlet_native_app', 'true');
```

### Window Globals Set

```javascript
window.streamletAuthenticated = true;
window.streamletEmail = 'user@example.com';
```

### Custom Event

```javascript
window.addEventListener('streamletNativeLogin', (event) => {
  // { authenticated: true, email: 'user@example.com' }
});
```

---

## Testing Flow

1. **Run app:** `./gradlew.bat installDebug`
2. **Tap "Sign in with Google"** → Native dialog opens
3. **Complete login** → No browser chrome visible
4. **Wait for page load** → App switches to WebView
5. **Check DevTools Console:**
   ```javascript
   (localStorage.getItem('streamlet_id_token')); // Should show token
   (window.streamletAuthenticated); // Should show true
   ```
6. **Login page should be skipped** → Directly to main content

---

## Debug Commands

### Check localStorage from Console

```javascript
// View all injected data
console.table({
  email: localStorage.getItem('streamlet_email'),
  token: localStorage.getItem('streamlet_id_token'),
  authenticated: localStorage.getItem('streamlet_authenticated'),
  skipLogin: localStorage.getItem('streamlet_skip_login'),
  nativeApp: localStorage.getItem('streamlet_native_app'),
});
```

### Listen for Custom Event

```javascript
// Add to console
window.addEventListener('streamletNativeLogin', (event) => {
});
```

### Check URL Parameters

```javascript
const params = new URLSearchParams(window.location.search);
({
  skipLogin: params.get('skip_login'),
  nativeApp: params.get('native_app'),
  email: params.get('email')
});
```

---

## Common Patterns

### Skip Login Guard

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const hasAuth = localStorage.getItem('streamlet_skip_login') === 'true' &&
                    localStorage.getItem('streamlet_id_token');
    
    if (hasAuth) {
      this.router.navigate(['/home']);
      return false; // Skip to home
    }
    return true; // Show login
  }
}
```

### Auto-Login Service

```typescript
@Injectable({ providedIn: 'root' })
export class AutoLoginService {
  checkNativeAuth(): Observable<boolean> {
    const email = localStorage.getItem('streamlet_email');
    const token = localStorage.getItem('streamlet_id_token');
    
    if (email && token) {
      // Validate token with backend
      return this.http.post('/api/auth/validate', { token });
    }
    return of(false);
  }
}
```

### Logout Helper

```typescript
logout() {
  // Clear all native auth data
  localStorage.removeItem('streamlet_email');
  localStorage.removeItem('streamlet_id_token');
  localStorage.removeItem('streamlet_authenticated');
  localStorage.removeItem('streamlet_skip_login');
  localStorage.removeItem('streamlet_native_app');
  
  // Redirect to login
  this.router.navigate(['/login']);
}
```

---

## API Integration

### Making Authenticated Requests

```typescript
// With interceptor (automatic)
this.http.get('/api/feeds'); // Token added automatically

// Without interceptor (manual)
const token = localStorage.getItem('streamlet_id_token');
this.http.get('/api/feeds', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Backend Token Validation

### Node.js/Express Example

```typescript
import admin from 'firebase-admin';

app.post('/api/auth/validate', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return res.json({ 
      valid: true, 
      email: decoded.email 
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| localStorage is empty | Check `onPageStarted()` logs in DevTools Console |
| Login page still shows | Verify `streamlet_skip_login === 'true'` in localStorage |
| API calls fail (401) | Ensure interceptor is adding Authorization header |
| Event not firing | Check custom event listener is added before page loads |
| Token expired | Implement token refresh logic in HTTP interceptor |

---

## File References

- **Android Implementation:** `ANDROID_APP_IMPLEMENTATION.md`
- **Full Website Guide:** `WEBSITE_AUTH_DETECTION.md`
- **Project Structure:** `00_READ_FIRST.md`
- **Main App Code:** `app/src/main/java/com/streamlet/app/ui/MainActivity.kt`

---

## Next Steps

1. ✅ Android app is production-ready
2. 📋 Implement the minimum implementation above in your Angular app
3. 🧪 Test the authentication flow end-to-end
4. 🔒 Validate tokens on your backend
5. 📱 Build release APK and submit to Play Store

---

## Need Help?

Check these files in order:

1. **For website questions:** `WEBSITE_AUTH_DETECTION.md`
2. **For Android questions:** `ANDROID_APP_IMPLEMENTATION.md`
3. **For general architecture:** `00_READ_FIRST.md`
4. **For console debugging:** Use `adb logcat | grep "Streamlet"`

All logs are prefixed with `[Streamlet]` for easy filtering.
