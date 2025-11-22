# Angular App: Native Authentication Implementation

Your Angular app is located at: `D:\Development\RssReader\rss-reader-app`

The issue is that your **login component is not checking for native app authentication** from the Android app.

---

## Solution: Add Native App Detection to LoginComponent

### File: `src/app/login/login.component.ts`

Replace your current LoginComponent with this updated version that detects native app authentication:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Only show login if NOT authenticated via native app -->
    <div class="login-container" *ngIf="!isNativeAppAuth">
      <div class="login-card">
        <div class="login-header">
          <h1>RSS Reader</h1>
          <p>Sign in to access your personalized RSS feeds</p>
        </div>

        <div class="login-body">
          <button class="google-login-btn" (click)="loginWithGoogle()">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <button class="demo-btn" (click)="loginAsDemo()">
            <span>🎯</span>
            <span>Try Demo (100 feeds, read-only)</span>
          </button>
        </div>

        <div class="login-footer">
          <p>Your feeds are private and only accessible to you</p>
        </div>
      </div>
    </div>

    <!-- Loading message if native app auth detected -->
    <div class="native-auth-loading" *ngIf="isNativeAppAuth">
      <div class="loader">
        <h2>Authenticating with native app...</h2>
        <p>Please wait while we verify your credentials</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 450px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }

    .login-header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      color: #333;
      font-weight: 600;
    }

    .login-header p {
      margin: 0 0 30px 0;
      color: #666;
      font-size: 16px;
    }

    .login-body {
      margin: 30px 0;
    }

    .google-login-btn {
      width: 100%;
      padding: 12px;
      background: #4285F4;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: background 0.3s;
    }

    .google-login-btn:hover {
      background: #357ae8;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    .divider {
      margin: 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #999;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #ddd;
    }

    .demo-btn {
      width: 100%;
      padding: 12px;
      background: #34A853;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: background 0.3s;
    }

    .demo-btn:hover {
      background: #2d8e47;
    }

    .login-footer p {
      margin: 20px 0 0 0;
      color: #999;
      font-size: 14px;
    }

    .native-auth-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .loader {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .loader h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .loader p {
      color: #666;
      margin: 0;
    }
  `]
})
export class LoginComponent implements OnInit {
  isNativeAppAuth = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if native app authentication is available
    this.checkNativeAppAuth();
  }

  private checkNativeAppAuth() {
    // CRITICAL: Check for native app authentication signals
    const skipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
    const idToken = localStorage.getItem('streamlet_id_token');
    const email = localStorage.getItem('streamlet_email');

    if (skipLogin && idToken && email) {
      this.isNativeAppAuth = true;

      // Set authenticated state in auth service
      this.authService.setNativeAppAuthenticated(email, idToken);

      // Navigate to main page after a short delay for visual feedback
      setTimeout(() => {
        this.router.navigate(['/list']);
      }, 500);
    } else {
    }
  }

  loginWithGoogle() {
    // Your existing Google login code
    this.authService.signIn();
  }

  loginAsDemo() {
    // Your existing demo login code
    this.authService.loginDemo();
  }
}
```

---

## Solution: Update AuthService to Handle Native App Auth

### File: `src/app/services/auth.service.ts`

Add this method to your AuthService:

```typescript
// Add this method to your AuthService class

/**
 * Handle native app authentication from Android app
 * Called when app detects native authentication tokens
 */
setNativeAppAuthenticated(email: string, idToken: string) {
  
  // Store credentials for API calls
  localStorage.setItem('streamlet_email', email);
  localStorage.setItem('streamlet_id_token', idToken);
  localStorage.setItem('streamlet_authenticated', 'true');
  
  // Update auth state in your auth service
  // This depends on your implementation - adjust accordingly
  // For example:
  // this.currentUser.next({ email, idToken });
  // or
  // this.isAuthenticatedSubject.next(true);
}

/**
 * Get the native app ID token for API calls
 */
getNativeAppToken(): string | null {
  return localStorage.getItem('streamlet_id_token');
}
```

---

## Solution: Update HTTP Interceptor for API Calls

### File: `src/app/services/http.interceptor.ts` (or similar)

Make sure your HTTP interceptor includes the token:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get token from localStorage (set by native app or web login)
    const token = localStorage.getItem('streamlet_id_token');
    
    // If token exists and request doesn't already have Authorization header
    if (token && !req.headers.has('Authorization')) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```

---

## Step-by-Step Installation

1. **Open your Angular project:**
   ```bash
   cd d:\Development\RssReader\rss-reader-app
   ```

2. **Update LoginComponent:**
   - Replace the code in `src/app/login/login.component.ts` with the code above

3. **Update AuthService:**
   - Add the `setNativeAppAuthenticated` and `getNativeAppToken` methods to your `src/app/services/auth.service.ts`

4. **Verify HTTP Interceptor:**
   - Make sure your HTTP interceptor includes the Authorization header with the token

5. **Save and test:**
   ```bash
   npm start
   # or
   ng serve
   ```

---

## Testing

1. **Close the app completely on Android**
2. **Clear app data:**
   ```bash
   adb shell pm clear com.streamlet.app
   ```
3. **Rebuild and install:**
   ```bash
   cd d:\Development\RssReader\RssReaderAndroid
   ./gradlew.bat installDebug
   ```
4. **Open app on Android**
5. **Sign in with Google** (native dialog, not in WebView)
6. **Watch the console:**
   - Should see `[Native App Check]` logs
   - Should see `[Native App] ✓ Detected!`
   - Should navigate directly to feeds list (skip login page)

---

## What This Does

1. **Detects native app auth** by checking localStorage values injected by the Android app
2. **Shows loading screen** while processing native authentication
3. **Sets auth state** in Angular services
4. **Navigates to main page** (`/list`) automatically
5. **Includes token in API calls** via HTTP interceptor

---

## Key Points

- ✅ Native app injects: `streamlet_skip_login`, `streamlet_id_token`, `streamlet_email`
- ✅ LoginComponent checks for these on init
- ✅ If all three present → skip login, go to feeds
- ✅ Token automatically included in all API requests
- ✅ No need for user to log in again after native Google sign-in

---

## Troubleshooting

If it still doesn't skip login:

1. **Check browser console** (chrome://inspect):
   ```
   [Native App Check] { skipLogin: true, hasToken: true, hasEmail: true, allPresent: true }
   [Native App] ✓ Detected! Setting user and navigating to feeds...
   ```

2. **Check localStorage:**
   ```javascript
   (localStorage.getItem('streamlet_skip_login'));
   (localStorage.getItem('streamlet_id_token'));
   ```

3. **If not detected**, check Android logs:
   ```bash
   adb logcat | grep Streamlet
   ```

---

Let me know when you've made these changes and we can test it!
