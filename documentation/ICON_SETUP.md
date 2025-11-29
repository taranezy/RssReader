# How to Use Your Web Favicon as Android Icon

## Current Status

✅ **Android app now has a custom icon!**
- Purple background (#667eea) matching your brand
- RSS feed symbol with "S" for Streamlet
- Modern adaptive icon for Android 8+

## If You Want to Use Exact Web Favicon

### Option 1: Get Favicon from Web App (Recommended)

#### Step 1: Find Your Favicon
1. Go to: https://streamlet.taranezy.com:8444
2. Right-click on page → "View Page Source" (Ctrl+U)
3. Look for lines containing:
   ```html
   <link rel="icon" href="...">
   <link rel="apple-touch-icon" href="...">
   or check manifest.json
   ```
4. Copy the favicon URL (usually `/favicon.ico` or `/assets/icons/...`)

#### Step 2: Download Favicon
**In browser:**
- Go to: `https://streamlet.taranezy.com:8444/favicon.ico` (or the path you found)
- Right-click → Save image as
- Or check your Angular project: `src/favicon.ico` or `src/assets/icons/`

#### Step 3: Convert to Multiple Sizes

Android needs different icon sizes:
- **mdpi:** 48x48 px
- **hdpi:** 72x72 px
- **xhdpi:** 96x96 px
- **xxhdpi:** 144x144 px
- **xxxhdpi:** 192x192 px

**Use Online Tool:**
1. Go to: https://icon.kitchen/ (Android Icon Generator)
2. Or: https://www.appicon.co/
3. Upload your favicon
4. Download Android icon pack
5. Extract and copy to your project

### Option 2: Use Android Asset Studio

**Generate Professional Icons:**
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your web favicon/logo
3. Adjust settings:
   - **Name:** ic_launcher
   - **Background:** #667eea (your purple)
   - **Foreground:** Your logo
   - **Shape:** Circle, Square, or Rounded
4. Click **Download ZIP**
5. Extract and copy folders to: `app/src/main/res/`

### Option 3: Manual Placement

If you have PNG files in different sizes:

```powershell
# Copy icons to Android project
Copy-Item "path/to/icon-48.png" -Destination "app/src/main/res/mipmap-mdpi/ic_launcher.png"
Copy-Item "path/to/icon-72.png" -Destination "app/src/main/res/mipmap-hdpi/ic_launcher.png"
Copy-Item "path/to/icon-96.png" -Destination "app/src/main/res/mipmap-xhdpi/ic_launcher.png"
Copy-Item "path/to/icon-144.png" -Destination "app/src/main/res/mipmap-xxhdpi/ic_launcher.png"
Copy-Item "path/to/icon-192.png" -Destination "app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
```

Then rebuild:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Quick Commands

### Check Current Icon
Look at your phone's app drawer - the Streamlet icon should now show:
- Purple background
- RSS feed waves
- "S" letter for Streamlet

### Rebuild with New Icon
```powershell
cd D:\Development\RssReader\RssReaderAndroid

# Build
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Current Icon Design

The icon I created features:
- 🟣 **Purple background** (#667eea) - matches your brand
- 📡 **RSS feed waves** - represents RSS reader functionality
- 📝 **"S" letter** - for Streamlet brand identity
- 🎨 **Adaptive icon** - looks good on all Android devices

This is a professional icon that represents your app's purpose while maintaining brand identity!

---

## Alternative: Get Icon from Your Angular Project

If you have the Angular source code:

```powershell
# Check these locations:
src/favicon.ico
src/assets/icons/icon-*.png
src/assets/images/logo.png
src/assets/logo.svg
```

Copy the largest PNG file (512x512 or 192x192) and use an icon generator to create all sizes.

---

## Icon Requirements for Play Store

When publishing, you'll also need:
- **512x512 PNG** for Play Store listing (high-res icon)
- This is different from app icon - it's for the store page only
- No transparency, solid background recommended
- Save to: `play-store-assets/icon-512x512.png`

The app icons (mipmap) are what users see on their phone!

---

**Your app now has a branded icon! 🎉**

Check your phone/emulator - you should see the new purple Streamlet icon in the app drawer!
