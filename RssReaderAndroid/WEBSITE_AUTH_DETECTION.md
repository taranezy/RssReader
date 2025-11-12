# Website Authentication Detection Guide

## Overview

The Android app now uses **native Google Sign-In** and passes authentication credentials to the website. The website must detect this native authentication and **skip its login page**, going directly to the main content.

This document explains how the app injects authentication and what the Angular website needs to do to detect it.

---

## How Authentication is Injected

When a user logs in via native Google Sign-In on Android, the app:

1. **Captures credentials** via `LoginActivity`
   - Stores: email, idToken, displayName
   
2. **Passes to WebView** via `MainActivity.kt`
   - Stores in class properties: `userEmail`, `userIdToken`
   
3. **Injects early** at page load via `WebViewClient.onPageStarted()`
   - Sets localStorage keys
   - Sets window global variables
   - Logs to console for debugging
   
4. **Verifies after load** via `WebViewClient.onPageFinished()`
   - Confirms localStorage is set
   - Dispatches custom event for Angular to detect
   - Logs verification status

5. **Adds URL parameters** when loading the app
   - `?skip_login=true&native_app=true`

---

## Detection Mechanisms

The website should check **multiple detection mechanisms** (for redundancy):

### Mechanism 1: localStorage Keys (Most Reliable)

These are set **early** before page renders:

```javascript
// Check if injected by native app
const isNativeApp = localStorage.getItem('streamlet_native_app') === 'true';
const shouldSkipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
const isAuthenticated = localStorage.getItem('streamlet_authenticated') === 'true';
const userEmail = localStorage.getItem('streamlet_email');
const idToken = localStorage.getItem('streamlet_id_token');

if (shouldSkipLogin && idToken) {
  // Skip login page, go directly to main content
  skipLoginPage(userEmail, idToken);
}
```

### Mechanism 2: Window Global Variables (Quick Access)

Set at the same time as localStorage:

```javascript
// Check window globals (available immediately)
if (window.streamletAuthenticated && window.streamletEmail) {
  skipLoginPage(window.streamletEmail);
}
```

### Mechanism 3: Custom Event (Angular Pattern)

Listen for `streamletNativeLogin` event on app startup:

```typescript
// In your Angular app initialization or AppComponent
export class AppComponent implements OnInit {
  ngOnInit() {
    // Listen for native app authentication
    window.addEventListener('streamletNativeLogin', (event: any) => {
      const { authenticated, email } = event.detail;
      
      if (authenticated) {
        this.handleNativeLogin(email);
      }
    });
    
    // Also check if already set (event may have fired before listener attached)
    if ((window as any).streamletAuthenticated) {
      this.handleNativeLogin((window as any).streamletEmail);
    }
  }
  
  private handleNativeLogin(email: string) {
    // Skip login, go directly to main content
    this.authService.setNativeAppAuthenticated(email);
    this.router.navigate(['/home']);
  }
}
```

### Mechanism 4: URL Parameters (Query String Fallback)

Added to the URL when loading:

```javascript
// Parse URL parameters
const params = new URLSearchParams(window.location.search);
const skipLogin = params.get('skip_login') === 'true';
const isNativeApp = params.get('native_app') === 'true';

if (skipLogin && isNativeApp) {
  const token = localStorage.getItem('streamlet_id_token');
  if (token) {
    skipLoginPage();
  }
}
```

---

## Implementation Example

Here's a complete example for your Angular routing guard or app initialization:

### In AuthService

```typescript
export class AuthService {
  private isNativeApp$ = new BehaviorSubject<boolean>(false);
  private nativeAppEmail$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.detectNativeApp();
  }

  private detectNativeApp() {
    // Check all detection mechanisms
    
    // 1. Check localStorage
    if (localStorage.getItem('streamlet_skip_login') === 'true') {
      const email = localStorage.getItem('streamlet_email');
      const token = localStorage.getItem('streamlet_id_token');
      if (token) {
        this.isNativeApp$.next(true);
        this.nativeAppEmail$.next(email);
        return;
      }
    }
    
    // 2. Check window globals
    if ((window as any).streamletAuthenticated) {
      this.isNativeApp$.next(true);
      this.nativeAppEmail$.next((window as any).streamletEmail);
      return;
    }
    
    // 3. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('native_app') === 'true') {
      const token = localStorage.getItem('streamlet_id_token');
      if (token) {
        this.isNativeApp$.next(true);
        this.nativeAppEmail$.next(params.get('email') || '');
        return;
      }
    }
    
    // 4. Listen for custom event as fallback
    window.addEventListener('streamletNativeLogin', (event: any) => {
      this.isNativeApp$.next(true);
      this.nativeAppEmail$.next(event.detail?.email);
    });
  }

  isNativeAuthenticated(): boolean {
    return this.isNativeApp$.value;
  }

  getNativeAppEmail(): string | null {
    return this.nativeAppEmail$.value;
  }

  getNativeIdToken(): string | null {
    return localStorage.getItem('streamlet_id_token');
  }
}
```

### In Routing Guard or AppComponent

```typescript
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if native app authentication is available
    if (this.authService.isNativeAuthenticated()) {
      
      // Set user session
      const email = this.authService.getNativeAppEmail();
      const idToken = this.authService.getNativeIdToken();
      
      // Navigate to main page
      this.router.navigate(['/home']);
      return;
    }
    
    // Otherwise show login form
    this.showLoginForm();
  }
}
```

---

## API Integration

When making API calls to the backend, include the idToken:

### Option 1: Using HTTP Interceptor (Recommended)

```typescript
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get token from localStorage (set by native app or web login)
    const token = localStorage.getItem('streamlet_id_token');
    
    if (token) {
      // Clone request and add authorization header
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    
    return next.handle(req);
  }
}
```

Add to your app module:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class AppModule {}
```

### Option 2: Manual Header Addition

```typescript
constructor(private http: HttpClient) {}

getRssFeeds() {
  const token = localStorage.getItem('streamlet_id_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  
  return this.http.get('/api/feeds', { headers });
}
```

---

## Injected Data Reference

### localStorage Keys

| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `streamlet_email` | String | user@example.com | User's email from Google login |
| `streamlet_id_token` | String | eyJhbGc... | Google ID Token for API authentication |
| `streamlet_authenticated` | String | "true" | Flag indicating authentication |
| `streamlet_skip_login` | String | "true" | Flag to skip login page |
| `streamlet_native_app` | String | "true" | Flag indicating native Android app |

### Window Globals

```typescript
window.streamletAuthenticated: boolean  // true if authenticated
window.streamletEmail: string           // User's email
```

### Custom Event

```typescript
type StreamletNativeLoginEvent = CustomEvent<{
  authenticated: boolean;
  email: string;
}>
```

### URL Parameters

```
?skip_login=true&native_app=true
```

---

## Console Debugging

The app logs authentication status to the browser console. View with:

```bash
# Android
adb logcat | grep "[Streamlet]"

# Browser DevTools (after enabling WebView debugging)
# chrome://inspect → Select WebView → Console
```

Example logs:
```
[Streamlet] Auth data injected - email: user@example.com
[Streamlet] Auth verified - authenticated: true, has token: true
[Streamlet] Native app detected, using injected token
```

---

## Testing Checklist

- [ ] Run app, tap "Sign in with Google"
- [ ] Verify Google Sign-In native dialog appears (no browser)
- [ ] After login, app switches to WebView
- [ ] Website detects native authentication
- [ ] Login page is skipped
- [ ] App goes directly to main RSS feed
- [ ] API calls work with injected token
- [ ] Browser DevTools shows localStorage has auth data
- [ ] Custom event is dispatched (check console)
- [ ] Manual logout clears all auth data

---

## Backend API Validation

The backend should validate the idToken from the Android app:

```typescript
// Example Node.js/Express endpoint
import admin from 'firebase-admin';

app.post('/api/validate-token', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify Google ID Token
    const ticket = await admin.auth().verifyIdToken(token);
    const email = ticket.email;
    
    // Look up user or create session
    const user = await User.findOrCreate({ email });
    
    res.json({ 
      success: true, 
      user: { email, id: user.id }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

---

## Troubleshooting

### Login Page Still Shows

1. **Check localStorage is set:**
   ```javascript
   ('localStorage:', {
     email: localStorage.getItem('streamlet_email'),
     token: localStorage.getItem('streamlet_id_token'),
     skipLogin: localStorage.getItem('streamlet_skip_login'),
   });
   ```

2. **Check window globals:**
   ```javascript
   ('window globals:', {
     authenticated: window.streamletAuthenticated,
     email: window.streamletEmail,
   });
   ```

3. **Listen for event:**
   ```javascript
   window.addEventListener('streamletNativeLogin', (e) => {
     ('[Streamlet] Event received!', e.detail);
   });
   ```

4. **Check URL parameters:**
   ```javascript
   ('URL:', window.location.search);
   ```

### API Calls Fail with 401

1. Verify token is in localStorage: `localStorage.getItem('streamlet_id_token')`
2. Verify backend is validating token correctly
3. Check Authorization header is being sent: DevTools → Network → Check request headers
4. Backend might need to handle `Bearer <token>` format

### App Still Shows Login Activity After Reload

This is normal. The native login only happens once per app session. To test again:
1. Force-close the app
2. Clear app data: Settings → Apps → Streamlet → Storage → Clear All Data
3. Reopen and log in again

---

## Security Notes

⚠️ **Important:**

- The idToken is issued by Google and is verified by Google's servers
- Never share the idToken client-side secrets
- Always validate the token on the backend before granting access
- Use HTTPS only (production backend already uses HTTPS)
- Tokens have an expiration time; handle token refresh if needed
- Clear all auth data on logout

---

## Support

For issues or questions about this authentication flow:

1. Check the console logs in DevTools
2. Verify all four detection mechanisms are being checked
3. Review the example implementations above
4. Ensure backend is properly validating tokens

The app emits detailed logs prefixed with `[Streamlet]` for debugging.
