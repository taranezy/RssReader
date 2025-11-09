# Android WebView Integration Guide

## Problem
The Angular app wasn't detecting authentication tokens from the Android app because:
1. Timing issues - Angular loads before Android injects tokens
2. No event notification when tokens are set
3. Storage events don't work across WebView boundaries

## Solution Implemented

### Frontend Changes (Already Done)

1. **Multiple Check Attempts** - Checks at 0ms, 100ms, and 500ms after load
2. **Storage Event Listener** - Listens for storage changes
3. **Custom Event Listener** - Listens for `androidAuthReady` event
4. **Detailed Logging** - Shows exactly what localStorage values are present/missing
5. **Global Helper Functions** - Android can call `window.notifyAngularAuthReady()` and `window.checkAndroidAuth()`

### Android Implementation Required

Here's how your Android app should inject authentication:

#### Method 1: Using JavaScript Injection (Recommended)

```kotlin
// In your WebView setup
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true

// After user authenticates with Google Sign-In
fun setWebViewAuth(email: String, idToken: String) {
    val jsCode = """
        (function() {
            console.log('[Android] Setting authentication...');
            
            // Set all required localStorage items
            localStorage.setItem('streamlet_email', '$email');
            localStorage.setItem('streamlet_id_token', '$idToken');
            localStorage.setItem('streamlet_native_app', 'true');
            localStorage.setItem('streamlet_skip_login', 'true');
            localStorage.setItem('streamlet_authenticated', 'true');
            
            console.log('[Android] Tokens set, notifying Angular...');
            
            // Notify Angular that auth is ready
            if (typeof window.notifyAngularAuthReady === 'function') {
                window.notifyAngularAuthReady();
            }
            
            // Dispatch storage event manually
            window.dispatchEvent(new Event('storage'));
            
            console.log('[Android] Auth setup complete');
        })();
    """.trimIndent()
    
    webView.evaluateJavascript(jsCode, null)
}
```

#### Method 2: Using JavaScriptInterface (Alternative)

```kotlin
class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun setAuthToken(email: String, idToken: String) {
        Log.d("WebView", "Setting auth via interface: $email")
        
        // This will be called from JavaScript
        // JavaScript side needs to handle localStorage
    }
}

// Add interface to WebView
webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

// Then inject from Kotlin:
val jsCode = """
    localStorage.setItem('streamlet_email', '$email');
    localStorage.setItem('streamlet_id_token', '$idToken');
    localStorage.setItem('streamlet_native_app', 'true');
    localStorage.setItem('streamlet_skip_login', 'true');
    window.notifyAngularAuthReady();
""".trimIndent()

webView.evaluateJavascript(jsCode, null)
```

## Complete Android WebView Setup

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webview)
        setupWebView()
    }
    
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            
            // Enable debugging in debug builds
            if (BuildConfig.DEBUG) {
                WebView.setWebContentsDebuggingEnabled(true)
            }
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                
                // Check if we have auth credentials
                val credentials = getStoredCredentials()
                if (credentials != null) {
                    injectAuthCredentials(credentials.email, credentials.idToken)
                }
            }
        }
        
        // Load your Angular app
        webView.loadUrl("http://your-server:4200")
    }
    
    private fun injectAuthCredentials(email: String, idToken: String) {
        val jsCode = """
            (function() {
                console.log('[Android] Injecting auth credentials...');
                localStorage.setItem('streamlet_email', '$email');
                localStorage.setItem('streamlet_id_token', '$idToken');
                localStorage.setItem('streamlet_native_app', 'true');
                localStorage.setItem('streamlet_skip_login', 'true');
                
                // Notify Angular
                if (typeof window.notifyAngularAuthReady === 'function') {
                    window.notifyAngularAuthReady();
                    console.log('[Android] Notification sent to Angular');
                } else {
                    console.log('[Android] WARNING: notifyAngularAuthReady not found!');
                }
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(jsCode) { result ->
            Log.d("WebView", "Auth injection result: $result")
        }
    }
    
    private fun getStoredCredentials(): AuthCredentials? {
        // Get from your secure storage (SharedPreferences, EncryptedSharedPreferences, etc.)
        val prefs = getSharedPreferences("auth", Context.MODE_PRIVATE)
        val email = prefs.getString("email", null)
        val idToken = prefs.getString("id_token", null)
        
        return if (email != null && idToken != null) {
            AuthCredentials(email, idToken)
        } else null
    }
    
    data class AuthCredentials(val email: String, val idToken: String)
}
```

## Testing from Android Studio

### 1. Chrome DevTools Remote Debugging

Enable WebView debugging in your app:

```kotlin
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

Then:
1. Connect Android device via USB
2. Open Chrome on desktop: `chrome://inspect`
3. Find your WebView and click "inspect"
4. Open Console and check for these logs:

```javascript
// Should see these in order:
[Android] Injecting auth credentials...
[Android] Notification sent to Angular
[LoginComponent] Storage event detected, rechecking auth...
[LoginComponent] Native App Auth Check: {...}
[LoginComponent] ✓ Native app authentication detected!
[LoginComponent] Navigating to /list...
```

### 2. Debug Helper Function

From Chrome DevTools console, you can check current state:

```javascript
window.checkAndroidAuth()
```

This will show what's currently in localStorage.

### 3. Manual Test

If you want to simulate Android authentication in Chrome DevTools:

```javascript
// Run this in browser console:
localStorage.setItem('streamlet_email', 'test@example.com');
localStorage.setItem('streamlet_id_token', 'fake-token-for-testing');
localStorage.setItem('streamlet_native_app', 'true');
localStorage.setItem('streamlet_skip_login', 'true');
window.notifyAngularAuthReady();
```

## Timing Diagram

```
Android App Load
     ↓
WebView Created
     ↓
Load http://server:4200
     ↓
HTML Loads (50-200ms)
     ↓
Angular Bootstrap (200-500ms)
     ↓
LoginComponent ngOnInit
     ↓
Check #1 (0ms) ← Usually FAILS (too early)
     ↓
Check #2 (100ms) ← Might work
     ↓
Check #3 (500ms) ← Should work
     ↓
[Android injects tokens ANYTIME]
     ↓
window.notifyAngularAuthReady()
     ↓
Check triggered by event ← ALWAYS works
     ↓
Navigate to /list ✓
```

## Required localStorage Keys

The Angular app checks for ALL of these. If ANY is missing, login page will show:

| Key | Value | Required |
|-----|-------|----------|
| `streamlet_email` | User email address | ✅ YES |
| `streamlet_id_token` | Google ID token | ✅ YES |
| `streamlet_native_app` | `"true"` (string) | ✅ YES |
| `streamlet_skip_login` | `"true"` (string) | ✅ YES |

**Important**: Values must be strings, not booleans!
- ✅ `localStorage.setItem('streamlet_native_app', 'true')`
- ❌ `localStorage.setItem('streamlet_native_app', true)` ← Wrong!

## Troubleshooting

### Issue: Login page still shows

**Check 1: Are tokens set?**
```javascript
window.checkAndroidAuth()
```

**Check 2: Look at console logs**
```javascript
// Should see:
[LoginComponent] Native App Auth Check: {
  skipLogin: true,
  hasToken: true,
  hasEmail: true,
  isNativeApp: true,
  allPresent: true
}
```

**Check 3: Timing issue?**
- Android should inject tokens in `onPageFinished()`
- Or inject BEFORE loading URL
- Or inject and then call `notifyAngularAuthReady()`

### Issue: Console shows "allPresent: false"

Check which specific values are missing:
```javascript
console.log({
  email: localStorage.getItem('streamlet_email'),
  token: localStorage.getItem('streamlet_id_token') ? 'present' : 'MISSING',
  native: localStorage.getItem('streamlet_native_app'),
  skip: localStorage.getItem('streamlet_skip_login')
});
```

### Issue: Backend returns 401

The Android authentication now creates a backend session. Make sure:
1. Backend is running on port 3000
2. WebView can access `http://your-server:3000`
3. Cookies are enabled in WebView:
   ```kotlin
   CookieManager.getInstance().setAcceptCookie(true)
   CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
   ```

## Security Notes

⚠️ **Production Considerations:**

1. **Verify ID Tokens** - Backend should verify Google ID tokens (see ANDROID_AUTH_FIX.md)
2. **Use HTTPS** - Don't send tokens over HTTP in production
3. **Secure Storage** - Store tokens in Android KeyStore or EncryptedSharedPreferences
4. **Token Expiry** - Google ID tokens expire after 1 hour, handle refresh
5. **Clear on Logout** - Clear all `streamlet_*` keys on logout:
   ```javascript
   localStorage.removeItem('streamlet_email');
   localStorage.removeItem('streamlet_id_token');
   localStorage.removeItem('streamlet_native_app');
   localStorage.removeItem('streamlet_skip_login');
   ```

## Summary

✅ Frontend now checks for auth 3 times + event listeners
✅ Android can call `window.notifyAngularAuthReady()` after setting tokens
✅ Detailed logging shows exactly what's missing
✅ Debug helper `window.checkAndroidAuth()` available
✅ Backend creates proper session for Android users

The login page should now be skipped when Android app sets the authentication tokens correctly!
