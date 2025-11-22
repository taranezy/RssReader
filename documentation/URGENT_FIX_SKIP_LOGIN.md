# URGENT FIX: Add This Code to Skip Login on Android

## The Problem

The Android app IS injecting authentication data via localStorage and window variables, but **your Angular website has NO CODE to detect it and skip the login page**.

## The Solution (Copy-Paste This)

### For Angular App.component.ts (or main component)

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit() {
    this.checkNativeAppAuth();
  }

  private checkNativeAppAuth() {
    // Check if running in native Android app
    const skipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
    const idToken = localStorage.getItem('streamlet_id_token');
    
    if (skipLogin && idToken) {
      
      // TODO: Change '/feeds' to your main page route
      // Examples:
      // - /feeds (RSS feeds)
      // - /home (home page)
      // - /dashboard (dashboard)
      // - /app (main app)
      
      this.router.navigate(['/feeds']); // ← CHANGE THIS TO YOUR MAIN PAGE
      return;
    }
    
  }
}
```

### Option 2: If You Use a Login Guard/Component

If you have a dedicated LoginComponent, add this:

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit() {
    // Skip if native app
    const skipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
    const idToken = localStorage.getItem('streamlet_id_token');
    
    if (skipLogin && idToken) {
      this.router.navigate(['/feeds']); // ← CHANGE THIS
      return;
    }
    
    // Otherwise show login form
    this.showLoginForm();
  }

  showLoginForm() {
    // Your existing login code here
  }
}
```

### Option 3: Add an HTTP Interceptor (For API Calls)

Make sure your API calls include the token:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get token from localStorage (set by native app or web login)
    const token = localStorage.getItem('streamlet_id_token');
    
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

Add to `app.module.ts`:

```typescript
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
export class AppModule { }
```

---

## CRITICAL: What's Your Main Page Route?

**I need you to tell me:** After login, users go to which page?
- `/feeds` ?
- `/home` ?
- `/dashboard` ?
- `/app` ?
- Something else?

That path should be in the `router.navigate()` call above. **That's the only thing you need to customize.**

---

## Test It Now

1. **Add the code above to your app**
2. **Deploy/reload your website**
3. **Re-run the app:**
   ```bash
   ./gradlew.bat installDebug
   ```
4. **Open app on Android**
5. **Tap "Sign in with Google"**
6. **See if it skips login and goes to main page**
7. **Check DevTools Console (chrome://inspect) for `[Native App]` logs**

---

## If It Still Doesn't Work

1. **Did you change `/feeds` to your actual main page route?**
2. **Did you reload/redeploy the website?**
3. **Did you check the browser console for errors?**
4. **Did you check Android logs?**
   ```bash
   adb logcat | grep Streamlet
   ```

---

## The Data Being Injected

Your app is already injecting this automatically:

```javascript
localStorage.setItem('streamlet_email', 'user@example.com');
localStorage.setItem('streamlet_id_token', 'eyJhbGc...');
localStorage.setItem('streamlet_authenticated', 'true');
localStorage.setItem('streamlet_skip_login', 'true');
localStorage.setItem('streamlet_native_app', 'true');

window.streamletAuthenticated = true;
window.streamletEmail = 'user@example.com';
```

You just need to **check for this data** and **skip the login page** if it exists.

---

## Quick Checklist

- [ ] I added the code to my AppComponent or LoginComponent
- [ ] I changed `/feeds` to my actual main page route
- [ ] I deployed/reloaded my website
- [ ] I rebuilt and installed the app
- [ ] I tested on Android
- [ ] I checked the browser console for `[Native App]` logs
- [ ] Login page is now skipped
- [ ] ✓ Success!

If any step failed, tell me which one and we'll debug it.
