# Android Studio Debug Configuration for localhost:4200

## Changes Made

### 1. MainActivity.kt - Debug Mode Configuration

Added debug mode support with automatic URL switching:

```kotlin
companion object {
    // Debug mode: use local dev server
    // Production: use deployed server
    private const val DEBUG_MODE = true  // Set to false for production
    private const val DEV_URL = "http://10.0.2.2:4200"  // For Android Emulator
    private const val DEV_URL_DEVICE = "http://192.168.1.100:4200"  // For Physical Device
    private const val PROD_URL = "https://streamlet.taranezy.com:8444"
    
    // Auto-detect: Use PROD_URL for production, DEV_URL for debug
    private val WEB_APP_URL = if (DEBUG_MODE) DEV_URL else PROD_URL
}
```

### 2. AndroidManifest.xml - Enable Cleartext Traffic

```xml
android:usesCleartextTraffic="true"
android:networkSecurityConfig="@xml/network_security_config"
```

### 3. network_security_config.xml - Allow localhost

Created new file to allow HTTP traffic to localhost during development.

---

## Setup Instructions

### For Android Emulator (Recommended for Development)

**Current Configuration**: Uses `http://10.0.2.2:4200`

1. **Start your Angular dev server:**
   ```powershell
   cd d:\Development\RssReader\rss-reader-app
   npm run start:frontend
   ```

2. **Start backend server:**
   ```powershell
   cd d:\Development\RssReader\rss-reader-app\backend
   node server.js
   ```

3. **Run app in Android Studio:**
   - Click Run (▶️) or Debug (🐛)
   - App will connect to `http://10.0.2.2:4200`
   - `10.0.2.2` is the emulator's alias for `localhost` on your PC

4. **Check Logcat for:**
   ```
   MainActivity: DEBUG_MODE: true
   MainActivity: WEB_APP_URL: http://10.0.2.2:4200
   MainActivity: Loading web app: http://10.0.2.2:4200
   ```

---

### For Physical Device

If testing on a real Android device:

1. **Get your PC's local IP:**
   ```powershell
   ipconfig
   # Look for IPv4 Address on your WiFi adapter
   # Example: 192.168.1.100
   ```

2. **Update MainActivity.kt:**
   ```kotlin
   private const val DEV_URL_DEVICE = "http://YOUR_PC_IP:4200"  // Update this!
   
   // Change this line:
   private val WEB_APP_URL = if (DEBUG_MODE) DEV_URL_DEVICE else PROD_URL
   ```

3. **Update network_security_config.xml:**
   Add your PC's IP to the allowed domains:
   ```xml
   <domain includeSubdomains="true">192.168.1.XXX</domain>
   ```

4. **Ensure device and PC are on same WiFi network**

5. **Allow port 4200 through Windows Firewall:**
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "Angular Dev Server" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
   ```

---

## Switching Between Debug and Production

### Enable Debug Mode (localhost):
```kotlin
private const val DEBUG_MODE = true
```

### Enable Production Mode (deployed server):
```kotlin
private const val DEBUG_MODE = false
```

Then rebuild and reinstall the app.

---

## Troubleshooting

### Issue: "ERR_CONNECTION_REFUSED"

**Check 1:** Is Angular dev server running?
```powershell
# Should show server running on 4200
netstat -ano | findstr :4200
```

**Check 2:** Is backend running?
```powershell
# Should show server running on 3000
netstat -ano | findstr :3000
```

**Check 3:** For Physical Device - Can you access from browser?
- On your phone, open Chrome
- Go to `http://YOUR_PC_IP:4200`
- If it doesn't load, check Windows Firewall

---

### Issue: "ERR_CLEARTEXT_NOT_PERMITTED"

This means cleartext HTTP is blocked. Verify:

1. **AndroidManifest.xml has:**
   ```xml
   android:usesCleartextTraffic="true"
   ```

2. **network_security_config.xml exists** at:
   ```
   app/src/main/res/xml/network_security_config.xml
   ```

3. **Rebuild the app** - Configuration changes require rebuild

---

### Issue: Still shows login page

**Check Logcat for:**
```
[Streamlet] Auth credentials injected from native app
[Streamlet] Auth verified: {authenticated: "true", ...}
[LoginComponent] ✓ Native app authentication detected!
```

**If missing**, the auth injection isn't working. Check:
1. Backend is running on port 3000
2. Frontend can reach backend via proxy
3. Check Chrome DevTools (chrome://inspect) for JavaScript errors

---

## Chrome DevTools Debugging

1. **Enable USB debugging** on Android device
2. **Connect device via USB**
3. **Open Chrome on PC:** `chrome://inspect`
4. **Find "Streamlet"** in the list
5. **Click "inspect"**
6. **Check Console for logs:**
   ```javascript
   // Verify localStorage
   window.checkAndroidAuth()
   
   // Should show:
   {
     skipLogin: "true",
     hasToken: true,
     email: "your@email.com",
     isNativeApp: "true"
   }
   ```

---

## Quick Reference

| Environment | URL | Use Case |
|------------|-----|----------|
| Emulator | `http://10.0.2.2:4200` | Default for development |
| Physical Device | `http://192.168.1.XXX:4200` | Testing on real device |
| Production | `https://streamlet.taranezy.com:8444` | Deployed app |

---

## Files Modified

1. ✅ `MainActivity.kt` - Added DEBUG_MODE and DEV_URL constants
2. ✅ `AndroidManifest.xml` - Enabled cleartext traffic
3. ✅ `network_security_config.xml` - Created to allow localhost
4. ✅ Added logging to show which URL is being used

---

## Current Configuration Summary

✅ **Debug Mode:** ENABLED
✅ **Dev Server:** `http://10.0.2.2:4200` (Emulator)
✅ **Cleartext Traffic:** Allowed for localhost
✅ **Network Security:** Configured
✅ **Logging:** Enhanced with URL display

---

## Next Steps

1. **Start servers:**
   ```powershell
   # Terminal 1 - Frontend
   cd d:\Development\RssReader\rss-reader-app
   npm run start:frontend
   
   # Terminal 2 - Backend  
   cd d:\Development\RssReader\rss-reader-app\backend
   node server.js
   ```

2. **Build and run app:**
   ```bash
   cd d:\Development\RssReader\RssReaderAndroid
   ./gradlew clean installDebug
   ```

3. **Monitor logs:**
   - Android Studio Logcat: Filter by "MainActivity"
   - Chrome DevTools: For web console logs

4. **When ready for production:**
   - Change `DEBUG_MODE = false` in MainActivity.kt
   - Rebuild and publish

---

## Security Note

⚠️ **Remember to disable DEBUG_MODE before releasing to Play Store:**

```kotlin
private const val DEBUG_MODE = false  // Production
```

This ensures the production app uses HTTPS and doesn't allow cleartext traffic.

---

Your app is now configured to use `localhost:4200` during debugging! 🎉
