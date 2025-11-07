# RSS Reader Android Client# RSS Reader Android App



Modern Android RSS Reader client connecting to your production backend at `https://taranezy.ddns.net:8444/`A modern RSS feed reader for Android with offline support and server synchronization capabilities.



## Architecture## Features



This is a **complete redesign** from scratch to be a proper Android API client, not a standalone app.- 📰 Subscribe to RSS and Atom feeds

- 💾 Offline storage with SQLite database

### Technology Stack- 🔄 Automatic background sync with server

- ⭐ Favorite feeds and articles

- **Language**: Kotlin 2.0.21 LTS- 📖 Mark articles as read/unread

- **Build**: Gradle 8.9, AGP 8.5.0- 🔖 Bookmark important articles

- **Architecture**: MVVM with Coroutines- 🎨 Material Design UI

- **UI**: Material Design 3, ViewBinding- 🌐 Custom tabs for in-app browsing

- **Network**: Retrofit 2.11 + OkHttp 4.12- 📱 Android 7.0+ support

- **Database**: Room 2.6 (for offline caching)

- **Auth**: Google Sign-In, OAuth 2.0## Architecture

- **Reactive**: Kotlin Flows, LiveData

The app follows modern Android development best practices:

### Project Structure

- **MVVM Architecture**: Separation of concerns with ViewModel and LiveData

```- **Room Database**: Local SQLite database for offline access

app/src/main/java/com/rssreader/app/- **Kotlin Coroutines**: Asynchronous programming

├── data/- **WorkManager**: Background synchronization

│   ├── model/           # Data models (User, Feed, Item, Preference)- **Repository Pattern**: Data abstraction layer

│   ├── remote/          # Retrofit API service & client setup- **Material Design Components**: Modern UI/UX

│   └── repository/      # Repository pattern for data access

├── ui/## Project Structure

│   ├── activity/        # Activities (Login, Main, Detail)

│   ├── fragment/        # Fragments (List, Grid, News views)```

│   └── viewmodel/       # ViewModelsapp/

└── util/                # Utilities & helpers├── src/main/

```│   ├── java/com/rssreader/app/

│   │   ├── data/

### Backend Connection│   │   │   ├── dao/              # Database Access Objects

│   │   │   ├── database/         # Room Database

**API Base URL**: `https://taranezy.ddns.net:8444/api/`│   │   │   ├── entity/           # Database Entities

│   │   │   ├── model/            # Data Models

All requests automatically include:│   │   │   ├── parser/           # RSS/Atom Parser

- Bearer token authentication│   │   │   ├── repository/       # Repository Layer

- Session cookies│   │   │   └── sync/             # Sync Service

- JSON content type│   │   ├── ui/

- Proper error handling│   │   │   ├── adapter/          # RecyclerView Adapters

│   │   │   ├── article/          # Article Activities

### Features (Planned)│   │   │   ├── feed/             # Feed Activities

│   │   │   ├── settings/         # Settings Activity

1. ✅ **Google OAuth** - Sign in with Google│   │   │   ├── viewmodel/        # ViewModels

2. ✅ **Fetch Feeds** - Load user's RSS feeds from backend│   │   │   └── MainActivity.kt

3. ✅ **Display Articles** - List, Grid, News view modes│   │   └── RssReaderApplication.kt

4. ✅ **Search** - Search articles across feeds│   └── res/                      # Resources (layouts, strings, etc.)

5. ✅ **Mark Read** - Track read/unread status```

6. ✅ **Manage Feeds** - Add/edit/delete feeds

7. ✅ **User Settings** - Font, theme, preferences## Setup & Build

8. ✅ **Offline Cache** - Room database for offline reading

### Prerequisites

## Building

- Android Studio Arctic Fox or later

### Prerequisites- JDK 17

- Android Studio 2024.1+- Android SDK 34

- Kotlin 2.0.21 LTS- Gradle 8.1+

- Java 17+

### Building the App

### Steps

1. **Clone the repository**

1. Clone this repository   ```bash

2. Open in Android Studio   git clone <repository-url>

3. Sync Gradle files   cd RssReaderAndroid

4. Build & run on emulator or device   ```



```bash2. **Open in Android Studio**

# Build debug APK   - File → Open → Select the `RssReaderAndroid` folder

./gradlew assembleDebug

3. **Sync Gradle**

# Run on connected device   - Android Studio will automatically sync Gradle dependencies

./gradlew installDebug

```4. **Build the project**

   ```bash

## API Integration   # Debug build

   ./gradlew assembleDebug

### Authentication Flow   

   # Release build

1. User taps "Sign in with Google"   ./gradlew assembleRelease

2. Android Google Sign-In sends OAuth token to backend   ```

3. Backend validates and creates session

4. App saves token to SharedPreferences5. **Run on device/emulator**

5. All subsequent API calls include token header   - Click the Run button in Android Studio

   - Or use: `./gradlew installDebug`

### API Endpoints

### Building APK

- `POST /auth/login` - Authenticate with Google token

- `GET /auth/me` - Get current user**Debug APK:**

- `GET /feeds` - List all user feeds```bash

- `POST /feeds` - Add new feed./gradlew assembleDebug

- `GET /items` - Get all articles```

- `GET /items?search=query` - Search articlesOutput: `app/build/outputs/apk/debug/app-debug.apk`

- `PUT /items/:id/read` - Mark article as read

**Release APK (unsigned):**

## UI/UX Design```bash

./gradlew assembleRelease

Matches your Angular app's beautiful design:```

Output: `app/build/outputs/apk/release/app-release-unsigned.apk`

- **Colors**: Purple gradient (#667eea → #764ba2)

- **Multiple Themes**: Ocean, Forest, Rose, Midnight, Fire, Tropical, Royal, Amber## Signing & Publishing

- **View Modes**: List (detailed), Grid (cards), News (newspaper layout)

- **Settings**: Font selection, theme colors, menu toggle, image toggle### Creating a Keystore

- **Modern UI**: Cards, shadows, transitions, responsive layouts

1. **Generate keystore:**

## Configuration   ```bash

   keytool -genkey -v -keystore rssreader.keystore -alias rssreader -keyalg RSA -keysize 2048 -validity 10000

### Google OAuth Setup   ```



To enable Google Sign-In:2. **Configure signing in `app/build.gradle`:**

   ```gradle

1. Create OAuth credentials in Google Cloud Console   android {

2. Get Client ID for Android       signingConfigs {

3. Add to `local.properties`:           release {

   ```properties               storeFile file("path/to/rssreader.keystore")

   google_client_id=YOUR_CLIENT_ID.apps.googleusercontent.com               storePassword "your-keystore-password"

   ```               keyAlias "rssreader"

               keyPassword "your-key-password"

### Backend URL           }

       }

Update in `ApiClient.kt`:       

       buildTypes {

```kotlin           release {

private const val BASE_URL = "https://taranezy.ddns.net:8444/api/"               signingConfig signingConfigs.release

```               // ... other settings

           }

## Development Notes       }

   }

- **No local database by default** - All data fetched from backend   ```

- **Room database** - Used only for offline caching (future)

- **Shared preferences** - Stores auth token and settings3. **Or use `gradle.properties` (recommended):**

- **Coroutines** - All network calls are non-blocking   ```properties

- **Flows** - UI observes data changes reactively   # In gradle.properties (add to .gitignore!)

   KEYSTORE_FILE=path/to/rssreader.keystore

## License   KEYSTORE_PASSWORD=your-password

   KEY_ALIAS=rssreader

© Your RSS Reader App   KEY_PASSWORD=your-password

   ```

## Status

   ```gradle

🚧 **In Development** - Core architecture complete, implementing UI layers   // In app/build.gradle

   signingConfigs {

- [x] API client setup       release {

- [x] Authentication models           storeFile file(KEYSTORE_FILE)

- [x] Repository pattern           storePassword KEYSTORE_PASSWORD

- [x] ViewModels           keyAlias KEY_ALIAS

- [x] Base layouts           keyPassword KEY_PASSWORD

- [ ] Google OAuth implementation       }

- [ ] Article list view   }

- [ ] Feed management   ```

- [ ] Settings screen

- [ ] Offline caching### Building Signed Release APK

- [ ] Testing

```bash

./gradlew assembleRelease
```

The signed APK will be at: `app/build/outputs/apk/release/app-release.apk`

### Building Android App Bundle (AAB) for Play Store

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

## Publishing to Google Play Store

### 1. Prepare Assets

- **App Icon**: High-res 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: At least 2 screenshots (phone and tablet)
- **Privacy Policy URL**: Required if app handles user data

### 2. Create Play Console Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 registration fee
3. Complete account verification

### 3. Create New App

1. Click "Create app"
2. Fill in app details:
   - App name: RSS Reader
   - Default language
   - App/Game: App
   - Free/Paid: Free

### 4. Set Up App Content

1. **Privacy Policy**: Add URL or inline policy
2. **App Access**: Describe access requirements
3. **Ads**: Declare if app contains ads
4. **Content Rating**: Complete questionnaire
5. **Target Audience**: Select age groups
6. **Data Safety**: Describe data collection

### 5. Upload Release

1. **Production Track** → Create new release
2. Upload the `.aab` file
3. Add release notes
4. Set rollout percentage (optional)
5. Review and rollout

### 6. Complete Store Listing

- Short description (80 chars)
- Full description (4000 chars)
- Screenshots (2-8 images)
- Feature graphic
- App icon
- App category
- Contact details

### 7. Pricing & Distribution

- Set countries
- Pricing (free/paid)
- Content rating confirmation

### 8. Submit for Review

- Review all sections
- Submit app for review
- Wait for approval (usually 1-7 days)

## Server Sync API (Optional)

If you want to enable server synchronization, implement a REST API with these endpoints:

### Endpoints

**Upload Feeds**
```
POST /api/feeds/upload
Authorization: Bearer {apiKey}

{
  "userId": "user123",
  "feeds": [
    {
      "localId": 1,
      "title": "Feed Title",
      "url": "https://example.com/feed.xml",
      "description": "Feed description",
      "category": "tech"
    }
  ]
}
```

**Download Feeds**
```
GET /api/feeds?userId={userId}
Authorization: Bearer {apiKey}

Response:
{
  "feeds": [...]
}
```

**Sync Article States**
```
POST /api/articles/sync-states
Authorization: Bearer {apiKey}

{
  "userId": "user123",
  "articleStates": [
    {
      "guid": "article-guid",
      "feedId": 1,
      "isRead": true,
      "isFavorite": false,
      "isBookmarked": true
    }
  ]
}
```

**Get Article States**
```
GET /api/articles/states?userId={userId}&since={timestamp}
Authorization: Bearer {apiKey}
```

## Database Schema

### Tables

- **feeds**: RSS feed subscriptions
- **articles**: Feed articles/items
- **sync_settings**: Server sync configuration

### Migrations

Room handles migrations automatically with `fallbackToDestructiveMigration()`. For production, implement proper migrations in `RssReaderDatabase.kt`.

## Testing

```bash
# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest
```

## ProGuard/R8

The app is configured with R8 code shrinking and obfuscation. ProGuard rules are in `app/proguard-rules.pro`.

## License

[Your License Here]

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
