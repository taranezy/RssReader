# Publishing Streamlet to Google Play Store

## Complete Step-by-Step Guide

---

## Prerequisites

✅ Google Play Developer Account ($25 one-time fee)  
✅ App tested and working  
✅ Privacy Policy URL  
✅ App screenshots (phone + tablet)  
✅ Feature graphic (1024x500px)  
✅ App icon (512x512px)  

---

## Part 1: Create Google Play Developer Account

### Step 1: Sign Up
1. Go to https://play.google.com/console/signup
2. Sign in with your Google account
3. Accept Developer Distribution Agreement
4. Pay $25 registration fee (one-time)
5. Complete account details

**Time:** 15-30 minutes  
**Cost:** $25 USD (one-time, lifetime)

---

## Part 2: Prepare Release APK/AAB

### Step 1: Generate Signing Key

You need a **keystore** to sign your app for release.

**Run this command in your project directory:**

```powershell
cd D:\Development\RssReader\RssReaderAndroid

# Generate keystore
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore streamlet-release.keystore -alias streamlet -keyalg RSA -keysize 2048 -validity 10000
```

**You'll be asked:**
- **Keystore password:** (Choose a strong password - SAVE THIS!)
- **Key password:** (Same as keystore password or different - SAVE THIS!)
- **First and Last Name:** Your name or company
- **Organization Unit:** Your team/department (or press Enter)
- **Organization:** Your company name (or press Enter)
- **City/Locality:** Your city
- **State/Province:** Your state
- **Country Code:** US, RS, etc.

**⚠️ CRITICAL: SAVE THIS INFORMATION SECURELY!**
```
Keystore File: streamlet-release.keystore
Keystore Password: [YOUR_PASSWORD]
Key Alias: streamlet
Key Password: [YOUR_PASSWORD]
```

**You cannot recover this!** If you lose it, you can never update your app!

---

### Step 2: Configure Release Build

Create/edit `app/keystore.properties`:

```powershell
# Create keystore.properties file
@"
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=streamlet
storeFile=../streamlet-release.keystore
"@ | Out-File -FilePath "app\keystore.properties" -Encoding UTF8
```

**Replace YOUR_KEYSTORE_PASSWORD and YOUR_KEY_PASSWORD with your actual passwords!**

---

### Step 3: Update build.gradle

Edit `app/build.gradle`:

```gradle
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

// Load keystore properties
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace = 'com.streamlet.app'
    compileSdk = 35

    defaultConfig {
        applicationId "com.streamlet.app"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled = true
            shrinkResources = true
            proguardFiles(getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro')
            signingConfig signingConfigs.release
        }
        debug {
            debuggable = true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.13.0'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.browser:browser:1.8.0'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

---

### Step 4: Build Release AAB (Android App Bundle)

**Google Play requires AAB format (not APK):**

```powershell
cd D:\Development\RssReader\RssReaderAndroid

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Build release AAB
.\gradlew.bat bundleRelease
```

**Output location:**
```
app/build/outputs/bundle/release/app-release.aab
```

**This is what you upload to Google Play!**

---

## Part 3: Prepare Store Listing Assets

### Required Graphics

#### 1. App Icon (Required)
- **Size:** 512x512 pixels
- **Format:** PNG (32-bit with alpha)
- **Content:** Streamlet logo
- **No text** in icon

#### 2. Feature Graphic (Required)
- **Size:** 1024x500 pixels
- **Format:** PNG or JPEG
- **Content:** App showcase banner

#### 3. Screenshots (Required - at least 2)

**Phone Screenshots:**
- Minimum 2, Maximum 8
- **Size:** 16:9 or 9:16 aspect ratio
- **Recommended:** 1080x1920 or 1920x1080
- Show: Login screen, feed view, article view, etc.

**Tablet Screenshots (Optional but recommended):**
- At least 1
- **Size:** 7" or 10" tablet resolution

#### 4. Promo Video (Optional)
- YouTube URL showcasing your app

---

### How to Capture Screenshots

**On your Android phone:**

1. **Install your app**
2. **Open app and navigate** to screens you want to capture
3. **Take screenshots:**
   - Press **Power + Volume Down** (most Android)
   - Or use **adb**: `adb exec-out screencap -p > screenshot.png`
4. **Trim/edit** screenshots to remove status bar if needed
5. **Save 2-8 screenshots** showing key features

---

## Part 4: Create Privacy Policy

**Required by Google Play!**

### Option 1: Use Generator
- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

### Option 2: Create Your Own

**Minimum Requirements:**
```
Privacy Policy for Streamlet

Information Collection:
- We collect: [Google account email, reading preferences, etc.]
- How: Through Google OAuth authentication
- Why: To provide personalized RSS feed experience

Data Usage:
- Stored on: Your secure servers at streamlet.taranezy.com
- Shared with: Not shared with third parties
- Retention: Data retained while account is active

User Rights:
- Access your data
- Delete your account
- Export your data

Contact: [your-email@example.com]
```

**Host this on your website** (e.g., `https://streamlet.taranezy.com:8444/privacy-policy`)

---

## Part 5: Create App in Play Console

### Step 1: Create New App

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name:** Streamlet
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept declarations
5. Click **"Create app"**

---

### Step 2: Store Listing

Fill in all required fields:

#### App Details
- **App name:** Streamlet
- **Short description:** (80 chars max)
  ```
  Stay updated with your favorite websites using Streamlet RSS Reader
  ```
- **Full description:** (4000 chars max)
  ```
  Streamlet is a modern RSS reader that helps you stay up-to-date with your favorite 
  websites, blogs, and news sources. With Google account integration, your feeds and 
  reading history sync across all your devices.

  Features:
  • Beautiful, intuitive interface
  • Google account integration
  • Sync across devices
  • Mark articles as read/unread
  • Save favorites for later
  • Fast and responsive
  • Secure authentication

  Never miss important updates from your favorite sources. Download Streamlet today!
  ```

#### Graphics
- Upload app icon (512x512)
- Upload feature graphic (1024x500)
- Upload phone screenshots (at least 2)
- Upload tablet screenshots (recommended)

#### Categorization
- **App category:** News & Magazines
- **Tags:** RSS, News, Reader, Feeds
- **Content rating:** Will be set in next step

#### Contact Details
- **Email:** your-email@example.com
- **Website:** https://streamlet.taranezy.com:8444
- **Privacy policy URL:** https://streamlet.taranezy.com:8444/privacy-policy

Click **"Save"**

---

### Step 3: Content Rating

1. Go to **"Content rating"** section
2. Fill out questionnaire:
   - Does app contain violence? **No**
   - Does app contain sexual content? **No**
   - Does app contain bad language? **No**
   - etc.
3. Submit for rating
4. You'll get ratings: **Everyone** (typically for RSS reader)

---

### Step 4: Target Audience

1. **Target age:** 13+ (or your preference)
2. **Appeal to children?** No (typically)
3. **Ads:** Does your app contain ads? **No** (unless you do)

---

### Step 5: App Access

1. **Special access:** Does app require special access? **No**
2. **Testing instructions:** Optional - how to test login

---

### Step 6: Data Safety

**IMPORTANT: Be honest about data collection**

1. **Data collection:** Yes (Google account email)
2. **Data sharing:** No (not shared with third parties)
3. **Data types:**
   - Personal info: Email address
   - App activity: Reading history, saved articles
4. **Security:** Encrypted in transit and at rest
5. **Can users delete data?** Yes
6. **Privacy policy URL:** [Your privacy policy URL]

---

## Part 6: Upload App Bundle

### Step 1: Create Release

1. Go to **"Production"** (left sidebar)
2. Click **"Create new release"**
3. **Upload app bundle:**
   - Click **"Upload"**
   - Select `app-release.aab`
   - Wait for upload and processing

### Step 2: Release Notes

```
Version 1.0.0 - Initial Release

What's New:
• Beautiful RSS feed reader
• Google account integration
• Chrome Custom Tabs for secure login
• Sync across devices
• Mark favorites and reading progress
• Fast and responsive interface

Thank you for using Streamlet!
```

### Step 3: Review Summary

- Review all warnings/errors
- Fix any issues
- Click **"Review release"**

---

## Part 7: Submit for Review

### Final Checklist

✅ Store listing complete  
✅ Graphics uploaded  
✅ Privacy policy published  
✅ Content rating received  
✅ App bundle uploaded  
✅ Release notes written  
✅ All warnings resolved  

### Submit

1. Click **"Start rollout to Production"**
2. Confirm submission
3. **App enters review queue**

---

## Part 8: Review Process

### Timeline
- **Review time:** 1-7 days (usually 1-3 days)
- **Status:** Check in Play Console dashboard

### Possible Outcomes

#### ✅ Approved
- App goes live automatically
- Users can find it in Play Store
- You'll receive email notification

#### ⚠️ Needs Changes
- Google requests clarifications or changes
- Fix issues and resubmit
- Common issues:
  - Privacy policy incomplete
  - Screenshots unclear
  - Permissions not justified

#### ❌ Rejected
- Violates Play Store policies
- Review rejection reason
- Fix and resubmit

---

## Part 9: After Approval

### Monitor Your App

1. **Play Console Dashboard:**
   - Install statistics
   - User ratings/reviews
   - Crash reports
   - User feedback

2. **Respond to Reviews:**
   - Thank positive reviews
   - Address issues in negative reviews
   - Update app based on feedback

### Update Your App

When you have new version:

```powershell
# Update version in build.gradle
versionCode 2
versionName "1.1.0"

# Build new AAB
.\gradlew.bat bundleRelease

# Upload to Play Console (Production → Create new release)
```

---

## Important Notes

### Version Management
- **versionCode:** Integer, increment for every release (1, 2, 3...)
- **versionName:** User-visible (1.0.0, 1.1.0, 2.0.0...)

### Google Play Requirements
- **Target SDK:** Must target API 33+ (you're using 34 ✅)
- **64-bit:** Must include 64-bit libraries (Kotlin handles this ✅)
- **Privacy Policy:** Required for apps accessing user data ✅
- **Data Safety:** Must declare data collection ✅

### AAB vs APK
- **Play Store:** Only accepts AAB (Android App Bundle)
- **Direct install:** Can use APK
- **AAB benefits:** Smaller downloads, better optimization

### Keystore Security
⚠️ **NEVER LOSE YOUR KEYSTORE!**
- Store in secure location
- Backup to cloud storage
- Save passwords in password manager
- Without it, you CANNOT update your app!

---

## Quick Command Reference

### Generate Keystore
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore streamlet-release.keystore -alias streamlet -keyalg RSA -keysize 2048 -validity 10000
```

### Build Release AAB
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat bundleRelease
```

### Build Release APK (for testing)
```powershell
.\gradlew.bat assembleRelease
```

### Sign Existing APK
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe" -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore streamlet-release.keystore app-release-unsigned.apk streamlet
```

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer Account | $25 | One-time (lifetime) |
| App hosting | $0 | Free (using your server) |
| Maintenance | $0 | Free (you maintain) |
| **Total to publish** | **$25** | **One-time** |

---

## Timeline Estimate

| Task | Time |
|------|------|
| Create developer account | 30 minutes |
| Generate keystore | 5 minutes |
| Configure signing | 15 minutes |
| Create privacy policy | 30 minutes |
| Take screenshots | 20 minutes |
| Create graphics | 1-2 hours (or hire designer) |
| Fill Play Console forms | 1 hour |
| Upload and submit | 15 minutes |
| **Total (your time)** | **3-4 hours** |
| Google review | **1-7 days** |

---

## Useful Links

- **Play Console:** https://play.google.com/console
- **Developer Policies:** https://play.google.com/about/developer-content-policy/
- **Launch Checklist:** https://developer.android.com/distribute/best-practices/launch/
- **App Bundle Guide:** https://developer.android.com/guide/app-bundle
- **Privacy Policy Generator:** https://www.privacypolicygenerator.info/

---

## Need Help?

### Common Issues

**Build Error:**
- Check keystore.properties paths
- Verify passwords are correct
- Ensure keystore file exists

**Upload Failed:**
- Check AAB file size (max 150MB)
- Verify signing configuration
- Try rebuilding with clean: `.\gradlew.bat clean bundleRelease`

**Review Rejection:**
- Read rejection email carefully
- Fix specific issues mentioned
- Resubmit with changes

---

## Ready to Start?

1. **Sign up** for Google Play Developer account ($25)
2. **Generate keystore** (5 min)
3. **Configure build** (15 min)
4. **Create graphics** (1-2 hours)
5. **Fill Play Console** (1 hour)
6. **Submit** and wait for review!

**Your app will be live in 1-7 days!** 🚀

---

Good luck with your Play Store launch! 🎉
