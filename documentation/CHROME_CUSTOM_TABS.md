# Option: Fix Android App with Chrome Custom Tabs

## The Problem
Google blocks OAuth in WebView. When your Angular app tries to show Google login inside the WebView, Google detects it's not a real browser and blocks it.

## The Solution
Intercept OAuth URLs and open them in **Chrome Custom Tabs** (real browser), then redirect back to WebView after login.

---

## Implementation Steps

### Step 1: Add Chrome Custom Tabs Dependency

Edit `app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies ...
    implementation 'androidx.browser:browser:1.8.0'
}
```

### Step 2: Detect OAuth URLs in WebView

When the WebView tries to load a Google OAuth URL, intercept it and open Chrome Custom Tabs instead.

### Step 3: Handle OAuth Callback

After successful login, Google redirects back to your app with the auth token.

---

## Why This Is Complex

1. **URL Detection**: Need to detect when WebView loads Google OAuth URLs
2. **Token Extraction**: Extract auth token from OAuth callback
3. **WebView Communication**: Pass token back to Angular app in WebView
4. **Deep Linking**: Configure app to receive OAuth redirects
5. **Session Management**: Sync auth state between browser and WebView

---

## Comparison

| Approach | Complexity | Google OAuth | Maintenance |
|----------|-----------|--------------|-------------|
| **PWA** | ⭐ Easy | ✅ Works natively | Minimal |
| **Chrome Custom Tabs** | ⭐⭐⭐⭐ Complex | ✅ Works | High |
| **Current WebView** | ⭐ Easy | ❌ Blocked | Minimal |

---

## Recommended: Use PWA Instead! 🎯

The Android app you built is doing exactly what a PWA does - loading your web app. But PWA:
- Works with Google OAuth out of the box
- No code changes needed (just `ng add @angular/pwa`)
- Auto-updates
- Simpler maintenance
- Works on iOS and Desktop too

**See `PWA_MIGRATION.md` for the easy solution!**

---

## If You Really Want Chrome Custom Tabs...

Here's the code structure you'd need:

```kotlin
// 1. Intercept OAuth URLs in WebViewClient
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url.toString()
        
        // Detect Google OAuth URL
        if (url.contains("accounts.google.com/oauth") || 
            url.contains("accounts.google.com/signin")) {
            // Open in Chrome Custom Tab
            openChromeCustomTab(url)
            return true // Don't load in WebView
        }
        return false // Load normally
    }
}

// 2. Open Chrome Custom Tab
private fun openChromeCustomTab(url: String) {
    val builder = CustomTabsIntent.Builder()
    builder.setToolbarColor(ContextCompat.getColor(this, R.color.primary_purple))
    val customTabsIntent = builder.build()
    customTabsIntent.launchUrl(this, Uri.parse(url))
}

// 3. Handle callback in AndroidManifest.xml
<activity android:name=".ui.MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="your-domain.com"
            android:pathPrefix="/oauth-callback" />
    </intent-filter>
</activity>

// 4. Handle callback in onCreate
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Check if launched from OAuth callback
    intent?.data?.let { uri ->
        if (uri.toString().contains("oauth-callback")) {
            // Extract token from URI
            val token = uri.getQueryParameter("token")
            // Inject into WebView
            injectTokenIntoWebView(token)
        }
    }
}
```

**This is just the beginning** - you'd also need:
- Token extraction logic
- State management between browser and WebView
- Error handling
- Session persistence
- Deep link configuration
- Server-side OAuth callback endpoint

---

## Bottom Line

**Time Investment:**
- PWA: 30 minutes (run `ng add @angular/pwa`, deploy)
- Chrome Custom Tabs: 8-16 hours (complex OAuth flow, testing, debugging)

**Result:**
- Both work with Google OAuth
- PWA is simpler, more maintainable, and works everywhere

**Recommendation:** Go with PWA! 🚀

Your Angular app is already built and working. Just make it installable and you're done!
