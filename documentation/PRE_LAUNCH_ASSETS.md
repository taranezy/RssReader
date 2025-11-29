# Pre-Launch Asset Preparation

## While Waiting for Google Play Verification

Complete these tasks before you get your passwords. Everything will be ready when verification comes through!

---

## ✅ PRIORITY 1: App Icon (5 minutes)

### Get Icon from Your Web App:

**Step 1: Find Your Web App Icon**
1. Go to: https://streamlet.taranezy.com:8444
2. Right-click on page → "View Page Source"
3. Look for: `<link rel="icon"` or `manifest.json`
4. Download the icon file

**OR:**

Check your Angular project:
```
src/assets/icons/
src/favicon.ico
src/assets/logo.png
```

**Step 2: Resize to 512x512**

Use online tool: https://www.iloveimg.com/resize-image
- Upload icon
- Resize to 512x512 pixels
- Download as PNG

**Save as:** `play-store-assets/icon-512x512.png`

---

## ✅ PRIORITY 2: Feature Graphic (30 minutes)

Create 1024x500 banner using **Canva** (free):

### Quick Canva Steps:

1. Go to https://www.canva.com
2. Click "Create a design" → "Custom size"
3. Enter: 1024 x 500 pixels
4. Design:
   - Background: Purple gradient (#667eea to #764ba2)
   - Add your icon (center-left)
   - Add "STREAMLET" text (white, bold)
   - Add tagline: "Modern RSS Reader" (smaller text)
5. Download as PNG

**Alternative Design:**
```
┌────────────────────────────────────────┐
│  [Icon]  STREAMLET                     │
│          Modern RSS Reader             │
│          Stay Updated with RSS Feeds   │
└────────────────────────────────────────┘
```

**Save as:** `play-store-assets/feature-graphic-1024x500.png`

---

## ✅ PRIORITY 3: Screenshots (10 minutes)

### Take from Your Phone:

**What to Capture:**
1. **Login screen** - Google sign-in button
2. **Feed list** - Articles/feeds displayed
3. **Article view** - Reading an article
4. **Menu** (if visible) - Settings or navigation

**How:**
1. Open Streamlet app on your phone
2. Navigate to each screen
3. Press: **Power + Volume Down**
4. Screenshots saved to your Photos

**Transfer to PC:**
- USB cable
- Google Photos
- Email to yourself
- Cloud storage

**Save as:**
```
play-store-assets/screenshots/
  ├── 01-login.png
  ├── 02-feed.png
  ├── 03-article.png
  └── 04-menu.png
```

---

## ✅ PRIORITY 4: Privacy Policy (20 minutes)

### Option A: Generator (Easiest)

1. Go to: https://app-privacy-policy-generator.firebaseapp.com/
2. Fill in:
   - **App name:** Streamlet
   - **Developer:** Boris Tarana / White Lodge Technologies
   - **Email:** your-email@example.com
   - **Website:** https://streamlet.taranezy.com:8444
   - **Data collected:** Email address (Google OAuth), Reading preferences
   - **Third parties:** Google (authentication)
3. Generate and download

### Option B: Use Template

```html
<!DOCTYPE html>
<html>
<head>
    <title>Streamlet Privacy Policy</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Privacy Policy for Streamlet</h1>
    <p><strong>Last updated: November 7, 2025</strong></p>
    
    <h2>Information We Collect</h2>
    <ul>
        <li>Email address (via Google OAuth authentication)</li>
        <li>Reading preferences and article history</li>
        <li>App usage data for improvement</li>
    </ul>
    
    <h2>How We Use Your Information</h2>
    <ul>
        <li>To provide personalized RSS feed experience</li>
        <li>To sync your data across devices</li>
        <li>To improve app functionality</li>
    </ul>
    
    <h2>Data Storage and Security</h2>
    <p>Your data is stored securely on our servers with HTTPS encryption. 
    We do not sell or share your personal information with third parties.</p>
    
    <h2>Third-Party Services</h2>
    <p>We use Google OAuth for secure authentication.</p>
    
    <h2>Your Rights</h2>
    <ul>
        <li>Access your data at any time</li>
        <li>Request data deletion</li>
        <li>Export your data</li>
    </ul>
    
    <h2>Contact</h2>
    <p>Email: your-email@example.com</p>
    <p>Website: https://streamlet.taranezy.com:8444</p>
    
    <h2>Consent</h2>
    <p>By using Streamlet, you agree to this privacy policy.</p>
</body>
</html>
```

**Save as:** `privacy-policy.html`

**Upload to:** `https://streamlet.taranezy.com:8444/privacy-policy.html`

**Make sure it's publicly accessible!**

---

## 📝 Store Listing Text (Already Written)

### Short Description (80 chars):
```
Stay updated with your favorite websites using Streamlet RSS Reader
```

### Full Description:
```
Streamlet is a modern RSS reader that helps you stay up-to-date with your 
favorite websites, blogs, and news sources. With Google account integration, 
your feeds sync across all devices.

FEATURES:
• Beautiful, intuitive interface
• Google account integration
• Sync across devices
• Secure Chrome Custom Tabs authentication
• Mark articles as read/unread
• Save favorites
• Fast and responsive
• No ads

PERFECT FOR:
• News enthusiasts
• Blog readers
• Tech updates followers
• Anyone wanting to stay informed

PRIVACY FIRST:
We don't sell your data. We don't show ads. Secure Google OAuth authentication.

Download Streamlet and take control of your content!
```

---

## 📂 Create Folders Now

```powershell
# Run this to create organized folders:
New-Item -ItemType Directory -Force -Path "play-store-assets"
New-Item -ItemType Directory -Force -Path "play-store-assets/screenshots"
New-Item -ItemType Directory -Force -Path "play-store-assets/graphics"
```

---

## 📋 Checklist

### Before Google Verification:
- [ ] Download icon from web app
- [ ] Resize icon to 512x512 PNG
- [ ] Create feature graphic (1024x500)
- [ ] Take 2-4 screenshots on phone
- [ ] Transfer screenshots to PC
- [ ] Generate privacy policy
- [ ] Upload privacy policy to server
- [ ] Test privacy policy URL works

### After Google Verification:
- [ ] Log into Play Console
- [ ] Create new app
- [ ] Upload icon
- [ ] Upload feature graphic
- [ ] Upload screenshots
- [ ] Paste descriptions
- [ ] Add privacy policy URL
- [ ] Fill content rating
- [ ] Build release AAB
- [ ] Upload AAB
- [ ] Submit for review

---

## 🚀 Quick Start Commands

### Create folders:
```powershell
cd D:\Development\RssReader\RssReaderAndroid
New-Item -ItemType Directory -Force -Path "play-store-assets/screenshots"
New-Item -ItemType Directory -Force -Path "play-store-assets/graphics"
```

### Take screenshots from connected phone:
```powershell
adb exec-out screencap -p > play-store-assets/screenshots/screenshot-1.png
```

### When ready to build AAB:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat bundleRelease
```

**Output:** `app/build/outputs/bundle/release/app-release.aab`

---

## ⏱️ Time Estimate

| Task | Time | Priority |
|------|------|----------|
| Get web app icon | 5 min | 🔥 High |
| Resize icon | 2 min | 🔥 High |
| Create feature graphic | 30 min | 🔥 High |
| Take screenshots | 10 min | 🔥 High |
| Generate privacy policy | 20 min | 🔥 High |
| Upload privacy policy | 5 min | 🔥 High |
| **Total** | **~1 hour** | |

---

## 🎯 What You'll Have Ready

When Google verification email arrives, you'll have:

✅ App icon (512x512 PNG)  
✅ Feature graphic (1024x500 PNG)  
✅ Screenshots (2-8 images)  
✅ Privacy policy (live URL)  
✅ Descriptions (short & full)  
✅ All organized in folders  

**You can fill Play Console in 30 minutes and submit!** 🎉

---

## 🆘 Need Help?

### Icon Not Found?
- Check browser DevTools → Network tab → Filter images
- Look in Angular `src/assets/` folder
- Use your company logo

### Can't Make Feature Graphic?
- Use PowerPoint with purple background
- Add icon + "STREAMLET" text
- Export as PNG

### No Screenshots?
- Use Android Studio emulator
- Or wait until phone is connected
- Need minimum 2 screenshots

---

**Start with the icon - that's the quickest task!** 

Once you have it, move to feature graphic using Canva. Everything else flows from there! 🚀
