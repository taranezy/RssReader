# Streamlet RSS Reader Android - AI Coding Instructions

## Project Overview

**Streamlet** is a hybrid Android app with a native login screen and a WebView-based main interface. The app connects to a production backend at `https://streamlet.taranezy.com:8444` and displays a responsive web interface for RSS feed management.

### Architecture Pattern
- **Native Layer:** Android Activities, Material Design UI, Google Sign-In authentication
- **Web Layer:** WebView displaying responsive Angular web app
- **Backend:** REST API at `https://streamlet.taranezy.com:8444/api/`

---

## Quick Start Commands

```bash
# Build debug APK
./gradlew.bat assembleDebug

# Build release AAB (for Play Store)
./gradlew.bat bundleRelease

# Run on connected device
./gradlew.bat installDebug
```

---

## Project Structure

```
app/src/main/
├── java/com/streamlet/app/
│   └── ui/
│       └── MainActivity.kt          # WebView wrapper, OAuth interception
├── res/
│   ├── layout/activity_main.xml     # WebView + toolbar + progress bar
│   ├── menu/main_menu.xml           # Refresh, Logout actions
│   ├── drawable/                    # Gradients (purple theme)
│   └── values/                      # Colors, strings, themes (Material 3)
└── AndroidManifest.xml              # Permissions, activities, deep links
```

---

## Key Architecture Decisions

### 1. WebView-Based UI (Not Native Fragments)
**Why:** The Angular web app is already responsive and feature-complete. Maintaining both native and web UIs would double maintenance burden.

**Pattern:** Login with native Android screens → Switch to WebView for main content

**Files:** `MainActivity.kt`, `activity_main.xml`

### 2. Chrome Custom Tabs for OAuth
**Why:** Google blocks OAuth in WebView. Chrome Custom Tabs open real browser for login, then return to app with session cookies.

**Pattern:** Intercept `accounts.google.com` URLs → Open `CustomTabsIntent` → Sync cookies on return

**Key Code:**
```kotlin
if (isGoogleOAuthUrl(url)) {
    openChromeCustomTab(url)
    return true  // Don't load in WebView
}
```

**Files:** `MainActivity.kt` (shouldOverrideUrlLoading, openChromeCustomTab)

### 3. Minimal Dependencies
**Why:** Reduces build time, app size, and maintenance complexity.

**What's Included:**
- Core KTX, AppCompat, Material 3, ConstraintLayout
- Chrome Custom Tabs, Google Play Services Auth
- ViewBinding (for type-safe UI access)

**What's NOT Included:**
- Room Database (no local caching)
- Retrofit (web app handles API calls)
- LiveData/ViewModel (state managed by web app)
- Navigation Component (web app handles navigation)

---

## Critical Implementation Details

### WebView Configuration (`MainActivity.kt`)

**Cookie Management:**
```kotlin
// Enable cookies for session persistence
CookieManager.getInstance().apply {
    setAcceptCookie(true)
    setAcceptThirdPartyCookies(webView, true)
}

// Sync cookies after returning from Chrome Custom Tabs
override fun onResume() {
    super.onResume()
    CookieManager.getInstance().flush()
}
```

**Why:** After OAuth login in Chrome, cookies must be synced so WebView has authentication.

### OAuth URL Interception

Detect Google OAuth URLs and redirect to Chrome:
```kotlin
override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
    val url = request?.url.toString()
    if (isGoogleOAuthUrl(url)) {
        openChromeCustomTab(url)
        return true
    }
    return false
}

private fun isGoogleOAuthUrl(url: String): Boolean {
    return url.contains("accounts.google.com/o/oauth2") ||
           url.contains("accounts.google.com/signin") ||
           url.contains("accounts.google.com/ServiceLogin") ||
           url.contains("accounts.google.com/gsi")
}
```

### Progress Bar During Loading

Show/hide progress bar as page loads:
```kotlin
webView.webChromeClient = object : WebChromeClient() {
    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        binding.progressBar.progress = newProgress
        binding.progressBar.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
    }
}
```

### Back Button Navigation

Handle Android back button to navigate WebView history:
```kotlin
override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
        webView.goBack()
        return true
    }
    return super.onKeyDown(keyCode, event)
}
```

### Logout Implementation

Clear all session data:
```kotlin
private fun logout() {
    webView.clearCache(true)
    webView.clearHistory()
    CookieManager.getInstance().removeAllCookies(null)
    CookieManager.getInstance().flush()
    webView.loadUrl(WEB_APP_URL)
}
```

---

## Common Development Tasks

### Add a Menu Item
1. Edit `app/src/main/res/menu/main_menu.xml`
2. Add `<item>` with `android:id`, `android:title`, `android:icon`
3. Handle in `MainActivity.onOptionsItemSelected()`

Example:
```xml
<item android:id="@+id/menu_settings" android:title="Settings" />
```

### Modify WebView Settings
Edit the `setupWebView()` function in `MainActivity.kt`:
```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    // Add more settings here
}
```

### Change Color Scheme
1. Update `app/src/main/res/values/colors.xml`
2. Update `gradient_header_purple.xml` drawables
3. Update `res/values/themes.xml` if needed

### Inject JavaScript into WebView
```kotlin
webView.evaluateJavascript("javascript:alert('Hello from Android')") {}
```

### Deep Linking (OAuth Callback)
Deep links configured in `AndroidManifest.xml`:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="streamlet.taranezy.com" />
</intent-filter>
```

---

## Build Configuration & Signing

### Debug Build
```bash
./gradlew.bat assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Release Build with Signing
1. Create keystore (one-time):
   ```bash
   keytool -genkey -v -keystore streamlet-release.keystore -alias streamlet -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `app/keystore.properties`:
   ```properties
   storePassword=YOUR_PASSWORD
   keyPassword=YOUR_PASSWORD
   keyAlias=streamlet
   storeFile=../streamlet-release.keystore
   ```

3. Build:
   ```bash
   ./gradlew.bat bundleRelease
   # Output: app/build/outputs/bundle/release/app-release.aab
   ```

⚠️ **NEVER commit `keystore.properties` or `.keystore` files to git!**

---

## Backend Integration

### API Base URL
```
https://streamlet.taranezy.com:8444/api/
```

### Authentication Flow
1. User logs in via native Android screen or web OAuth
2. Backend validates credentials and returns auth token
3. Token stored in SharedPreferences or cookies
4. WebView receives cookies from Chrome after OAuth
5. Subsequent API calls include authentication automatically

### Session Management
- Cookies are shared between Chrome and WebView on Android
- `CookieManager.getInstance().flush()` syncs cookies
- Logout clears all cookies and WebView data

---

## Testing & Debugging

### View Logs
```bash
adb logcat | grep MainActivity
```

### Enable WebView Debugging
```kotlin
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

Then access in Chrome DevTools: `chrome://inspect`

### Test OAuth Flow
1. Install debug APK: `./gradlew.bat installDebug`
2. Tap Google Sign-In button
3. Chrome Custom Tab should open (not WebView)
4. Log in with Google
5. After login, return to app
6. WebView should be authenticated

---

## Deployment & Play Store

### Version Management
Update in `app/build.gradle`:
```gradle
versionCode 1    // Increment for every release
versionName "1.0.0"
```

### Play Store Submission
1. Build release AAB: `./gradlew.bat bundleRelease`
2. Create app in Google Play Console
3. Upload AAB to Production track
4. Complete store listing (description, screenshots, privacy policy)
5. Submit for review

See `PLAY_STORE_PUBLISHING_GUIDE.md` for detailed steps.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **WebView shows blank page** | Check internet connection, verify URL is accessible |
| **OAuth doesn't work** | Ensure Chrome Custom Tab logic is active, check `isGoogleOAuthUrl()` |
| **App crashes on load** | Check `AndroidManifest.xml` permissions, verify `MainActivity` is exported |
| **Cookies not syncing** | Call `CookieManager.getInstance().flush()` in `onResume()` |
| **Back button doesn't work** | Verify `onKeyDown()` implementation checks `webView.canGoBack()` |
| **Gradle build fails** | Run `./gradlew.bat clean` then rebuild, check Java 17 is configured |

---

## Documentation References

- **Architecture:** See `00_READ_FIRST.md`, `WEBVIEW_CONVERSION.md`
- **Chrome Custom Tabs:** See `CHROME_CUSTOM_TABS_IMPLEMENTED.md`
- **Play Store:** See `PLAY_STORE_PUBLISHING_GUIDE.md`
- **PWA Alternative:** See `PWA_MIGRATION.md`
- **Assets:** See `PRE_LAUNCH_ASSETS.md`, `ICON_SETUP.md`

---

## Key Files for AI Agents

When modifying this project, these files are typically involved:

| Task | Primary Files |
|------|---|
| Change UI layout | `activity_main.xml`, `themes.xml`, `colors.xml` |
| Add menu items | `main_menu.xml`, `MainActivity.onOptionsItemSelected()` |
| Modify WebView behavior | `MainActivity.setupWebView()`, `MainActivity.kt` |
| Handle OAuth | `MainActivity.isGoogleOAuthUrl()`, `MainActivity.openChromeCustomTab()` |
| Change backend URL | `MainActivity.WEB_APP_URL` constant |
| Adjust permissions | `AndroidManifest.xml` `<uses-permission>` tags |
| Sign releases | `app/build.gradle` signingConfigs, `keystore.properties` |

---

## Development Workflow

1. **Modify code** in Android Studio or VS Code
2. **Sync Gradle:** `./gradlew.bat build --refresh-dependencies`
3. **Build:** `./gradlew.bat assembleDebug`
4. **Install:** `./gradlew.bat installDebug`
5. **Test:** Use device or emulator, check `adb logcat` for errors
6. **Debug:** Enable WebView debugging, use Chrome DevTools

---

## Important Constraints

- ✅ **JavaScript required:** WebView loads Angular app (requires JS)
- ✅ **HTTPS only:** Backend is HTTPS only, no cleartext traffic
- ✅ **Responsive design:** Website must be mobile-responsive (already is)
- ✅ **Cookie management:** Critical for session persistence
- ✅ **OAuth interception:** Must use Chrome Custom Tabs for Google login

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Kotlin | 2.0.21 LTS |
| Build System | Gradle | 8.9 |
| Compiler | AGP | 8.5.0 |
| Min SDK | Android | 7.0 (API 26) |
| Target SDK | Android | 14 (API 35) |
| UI Framework | Material Design 3 | 1.11.0 |
| WebView | Chrome Custom Tabs | 1.8.0 |
| Auth | Google Sign-In | 21.0.0 |

---

## Questions for AI Agents

Before making changes, consider:

1. **Does this change affect authentication?** If yes, test OAuth flow.
2. **Does this involve WebView settings?** Reference `setupWebView()`.
3. **Is this a UI change?** Update `activity_main.xml` or `themes.xml`.
4. **Are cookies/sessions involved?** Remember cookie syncing in `onResume()`.
5. **Is this for Play Store?** Update `versionCode` and `versionName`.

---

## Last Updated

November 9, 2025

**Status:** Production-ready hybrid app with native login + WebView interface.
