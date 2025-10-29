# RSS Reader - Multi-User Setup Guide

## Google OAuth Configuration

This application uses Google OAuth for authentication. Each user will only see their own RSS feeds.

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - (Add your production URL when deploying)
   - Add authorized JavaScript origins:
     - `http://localhost:4200`
     - `http://localhost:3000`
   - Click "Create"

5. Copy your Client ID and Client Secret

### Step 2: Configure Environment Variables

1. Navigate to the backend folder:
   ```bash
   cd rss-reader-app/backend
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

3. Edit `.env` and add your Google OAuth credentials:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id-here
   GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   SESSION_SECRET=generate-a-random-string-here
   PORT=3000
   ```

   **Important**: Generate a strong random string for `SESSION_SECRET` in production!

### Step 3: Install Dependencies

If you haven't already, install the dependencies:

```bash
npm install
```

### Step 4: Start the Application

From the root of the project:

```bash
npm start
```

This will start both the Angular frontend (port 4200) and the Node.js backend (port 3000).

### Step 5: First Login

1. Open your browser and navigate to `http://localhost:4200`
2. You'll be redirected to the login page
3. Click "Sign in with Google"
4. Select your Google account
5. Grant permissions to the application
6. You'll be redirected back to the RSS Reader

## Features

- **Multi-User Support**: Each user has their own separate feed collection
- **Google SSO**: Secure authentication using Google accounts
- **User Isolation**: Users can only see and manage their own feeds
- **Session Management**: Stay logged in for 24 hours
- **Automatic Logout**: Secure logout functionality

## Database Structure

The SQLite database includes:
- `users` table: Stores user information (email, username, Google ID)
- `rss_feeds` table: Stores RSS feeds with user_id foreign key
- `rss_items` table: Stores feed items with user_id foreign key
- `user_preferences` table: Stores user preferences with user_id foreign key

All data is isolated by user - queries are filtered by the authenticated user's ID.

## Security Notes

- Never commit `.env` file to version control
- Use strong random strings for `SESSION_SECRET` in production
- Enable HTTPS in production and set `cookie.secure = true`
- Regularly update dependencies for security patches

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in
- Check that your session hasn't expired
- Verify backend server is running on port 3000

### Google OAuth Not Working
- Verify your Client ID and Client Secret in `.env`
- Check authorized redirect URIs in Google Cloud Console
- Ensure ports 3000 and 4200 are not blocked by firewall

### Database Errors
- The database file is created automatically in `backend/data/rss-reader.db`
- Make sure the backend has write permissions to the `data` folder
- If corrupted, delete the `.db` file and restart (will lose all data)

## Development vs Production

### Development (Current Setup)
- Uses `http://localhost`
- Session cookies are not secure
- Callback URL: `http://localhost:3000/api/auth/google/callback`

### Production Recommendations
- Use HTTPS
- Set `cookie.secure = true` in server.js
- Update callback URL to your production domain
- Use environment-specific `.env` files
- Consider using a production-grade database (PostgreSQL, MySQL)
