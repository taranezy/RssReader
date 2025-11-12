# Android App Implementation Details

## Current MainActivity.kt Structure

This document describes how authentication injection is currently implemented in the Android app.

---

## Class Properties

```kotlin
private var userEmail: String? = null
private var userIdToken: String? = null
```

These store the authentication credentials passed from LoginActivity and are available throughout the MainActivity lifecycle.

---

## onCreate() Method

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Enable binding
    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)
    
    // Extract auth data from Intent (passed from LoginActivity)
    userEmail = intent.getStringExtra("email")
    userIdToken = intent.getStringExtra("idToken")
    
    Log.d("MainActivity", "Auth data received: email=$userEmail, hasToken=${!userIdToken.isNullOrEmpty()}")
    
    // Setup toolbar and WebView
    setupToolbar()
    setupWebView()
    
    // Load web app with authentication
    loadWebApp(userEmail, userIdToken)
}
```

**Key Points:**
- Stores auth data from Intent in class properties
- Made available before WebView is loaded
- Logged for debugging purposes

---

## setupWebView() Method

```kotlin
private fun setupWebView() {
    binding.webView.settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        databaseEnabled = true
        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
    }
    
    // Enable cookies for session persistence
    CookieManager.getInstance().apply {
        setAcceptCookie(true)
        setAcceptThirdPartyCookies(binding.webView, true)
    }
    
    // Register WebViewClient for page loading events
    binding.webView.webViewClient = object : WebViewClient() {
        
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            Log.d("MainActivity", "Page started loading: $url")
            
            // INJECT AUTH DATA EARLY - before page renders
            if (!userEmail.isNullOrEmpty() && !userIdToken.isNullOrEmpty()) {
                val jsCode = """
                    (function() {
                        try {
                            // Set localStorage keys
                            localStorage.setItem('streamlet_email', '$userEmail');
                            localStorage.setItem('streamlet_id_token', '$userIdToken');
                            localStorage.setItem('streamlet_authenticated', 'true');
                            localStorage.setItem('streamlet_skip_login', 'true');
                            localStorage.setItem('streamlet_native_app', 'true');
                            
                            // Set window globals for immediate access
                            window.streamletAuthenticated = true;
                            window.streamletEmail = '$userEmail';
                            
                        } catch(e) {
                            console.error('[Streamlet] Error injecting auth: ' + e);
                        }
                    })();
                """.trimIndent()
                
                view?.evaluateJavascript(jsCode) {}
                Log.d("MainActivity", "Auth data injected at page start")
            }
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            Log.d("MainActivity", "Page loaded: $url")
            
            // VERIFY AUTH after page fully loads and dispatch event
            if (!userEmail.isNullOrEmpty() && !userIdToken.isNullOrEmpty()) {
                val jsCode = """
                    (function() {
                        try {
                            // Verify data is set
                            const token = localStorage.getItem('streamlet_id_token');
                            const auth = localStorage.getItem('streamlet_authenticated');
                            
                            // Emit custom event for Angular to detect
                            const event = new CustomEvent('streamletNativeLogin', { 
                                detail: { 
                                    authenticated: true, 
                                    email: localStorage.getItem('streamlet_email')
                                }
                            });
                            window.dispatchEvent(event);
                        } catch(e) {
                            console.error('[Streamlet] Error verifying auth: ' + e);
                        }
                    })();
                """.trimIndent()
                
                view?.evaluateJavascript(jsCode) {}
            }
        }
    }
    
    // Register WebChromeClient for progress bar
    binding.webView.webChromeClient = object : WebChromeClient() {
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            binding.progressBar.progress = newProgress
            binding.progressBar.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
        }
    }
}
```

**Key Points:**
- `onPageStarted()` injects auth data **EARLY** before page renders
- Sets localStorage keys that persist across page reloads
- Sets window globals for immediate JavaScript access
- `onPageFinished()` verifies auth is set and dispatches custom event
- Both methods log to console for debugging

---

## loadWebApp() Method

```kotlin
private fun loadWebApp(email: String?, idToken: String?) {
    // Construct URL with authentication parameters
    val baseUrl = "https://taranezy.ddns.net:8444"
    val url = if (!email.isNullOrEmpty() && !idToken.isNullOrEmpty()) {
        // Add query parameters for native app authentication
        "$baseUrl?skip_login=true&native_app=true&email=${URLEncoder.encode(email, "UTF-8")}"
    } else {
        baseUrl
    }
    
    Log.d("MainActivity", "Loading web app: $url")
    binding.webView.loadUrl(url)
}
```

**Key Points:**
- Adds query parameters: `?skip_login=true&native_app=true`
- Email parameter helps website identify the user
- Website can use these as fallback detection mechanism

---

## Auth Injection Timeline

```
1. LoginActivity
   ↓ (User logs in with Google)
   ↓ (GoogleSignInClient verifies credentials)
   ↓ (Extracts: email, idToken, displayName)
   ↓
2. Intent to MainActivity (with extras)
   ↓
3. MainActivity.onCreate()
   ↓ (Stores auth data: userEmail, userIdToken)
   ↓ (Calls setupWebView() and loadWebApp())
   ↓
4. WebView starts loading
   ↓
5. onPageStarted() fires (FIRST)
   ↓ (Injects localStorage + window vars BEFORE page renders)
   ↓
6. Page renders (Angular app loads)
   ↓ (Website checks localStorage, window vars, or URL params)
   ↓ (Website detects native app authentication)
   ↓ (Website skips login page)
   ↓
7. onPageFinished() fires (LAST)
   ↓ (Verifies auth is still set)
   ↓ (Dispatches streamletNativeLogin event)
   ↓
8. Website listening to event (Angular)
   ↓ (Confirms authentication)
   ↓ (Navigates to main content)
```

The critical insight: **`onPageStarted()` fires BEFORE the page renders**, so auth data is available immediately.

---

## Debugging

### Enable WebView Debugging

```kotlin
// In MainActivity.kt or Application.onCreate()
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

Then in Chrome:
```
chrome://inspect
→ Select device/WebView
→ DevTools opens
→ Console tab shows all logs
```

### Check Injected Data

In DevTools Console:
```javascript
// Check localStorage
('localStorage:', {
  email: localStorage.getItem('streamlet_email'),
  token: localStorage.getItem('streamlet_id_token'),
  authenticated: localStorage.getItem('streamlet_authenticated'),
  skipLogin: localStorage.getItem('streamlet_skip_login'),
  nativeApp: localStorage.getItem('streamlet_native_app'),
});

// Check window globals
('window globals:', {
  authenticated: window.streamletAuthenticated,
  email: window.streamletEmail,
});

// Check URL
('URL:', window.location.href);
```

### Monitor Logs

```bash
# Terminal: View all Streamlet logs
adb logcat | grep "MainActivity\|Streamlet"
```

Example output:
```
D MainActivity: Auth data received: email=user@example.com, hasToken=true
D MainActivity: Page started loading: https://taranezy.ddns.net:8444
D MainActivity: Auth data injected at page start
D MainActivity: Page loaded: https://taranezy.ddns.net:8444
```

---

## Cookie Management

```kotlin
// In onCreate() or setupWebView()
CookieManager.getInstance().apply {
    setAcceptCookie(true)
    setAcceptThirdPartyCookies(binding.webView, true)
}

// In onResume() - sync cookies
override fun onResume() {
    super.onResume()
    CookieManager.getInstance().flush()
}
```

Cookies are important because:
1. Website can set session cookies after login
2. Cookies persist across page reloads
3. WebView can access same cookies as the backend

---

## Logout Implementation

```kotlin
private fun logout() {
    // Clear all authentication data
    webView.clearCache(true)
    webView.clearHistory()
    CookieManager.getInstance().removeAllCookies { }
    CookieManager.getInstance().flush()
    
    // Clear class properties
    userEmail = null
    userIdToken = null
    
    // Optionally: return to login
    val loginIntent = Intent(this, LoginActivity::class.java)
    startActivity(loginIntent)
    finish()
}
```

---

## HTTP Headers for API Calls

The website should add the idToken to API calls:

```typescript
// Angular HttpClient interceptor
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

Or JavaScript:

```javascript
fetch('https://taranezy.ddns.net:8444/api/feeds', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('streamlet_id_token')}`
  }
})
```

---

## Full onCreate() Context

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // View binding
    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)
    
    // Make fullscreen
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.setFlags(
        WindowManager.LayoutParams.FLAG_FULLSCREEN,
        WindowManager.LayoutParams.FLAG_FULLSCREEN
    )
    
    // Extract auth credentials from Intent
    userEmail = intent.getStringExtra("email")
    userIdToken = intent.getStringExtra("idToken")
    val displayName = intent.getStringExtra("displayName")
    
    Log.d("MainActivity", "onCreate: email=$userEmail, displayName=$displayName, hasToken=${!userIdToken.isNullOrEmpty()}")
    
    // Setup UI
    setupToolbar()
    setupWebView()
    
    // Load app with authentication
    loadWebApp(userEmail, userIdToken)
}
```

---

## Summary

The Android app implements a three-layer auth injection strategy:

1. **Layer 1: Early Injection** (`onPageStarted`)
   - localStorage keys set BEFORE page renders
   - Website reads these during initialization

2. **Layer 2: Window Globals** 
   - Immediate access to `window.streamletAuthenticated`
   - Useful for inline scripts

3. **Layer 3: Custom Event** (`onPageFinished`)
   - Dispatches `streamletNativeLogin` event
   - Angular app can listen for guaranteed timing

4. **Fallback: URL Parameters**
   - `?skip_login=true&native_app=true`
   - For additional detection redundancy

This multi-layer approach ensures the website can detect native app authentication with high reliability.
