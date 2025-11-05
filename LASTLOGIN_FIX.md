# Last Login Update Fix

## Summary
Updated the authentication system to ensure that the `last_login` field in the `users` table is updated on **every login**, for both new users and existing users, through both Google authentication and demo login.

## Changes Made

### 1. Google Authentication (server.js - Lines 65-83)
**Before:**
```javascript
if (!user) {
  // Create new user
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  const username = profile.displayName || email;
  const userId = db.createUser(email, username, profile.id);
  user = db.findUserById(userId);
} else {
  // Update last login
  db.updateUserLastLogin(user.id);  // <-- Only called for existing users
}
```

**After:**
```javascript
if (!user) {
  // Create new user
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  const username = profile.displayName || email;
  const userId = db.createUser(email, username, profile.id);
  user = db.findUserById(userId);
}

// Update last login for both new and existing users
db.updateUserLastLogin(user.id);  // <-- Now called for ALL users
```

**Fix:** Moved `updateUserLastLogin()` outside the if-else block so it's called for both new and existing users.

### 2. Demo Login (server.js - Lines 308-318)
**Before:**
```javascript
} // End of if (needsFeeds)

// Create session for demo user
req.login(demoUser, (err) => {
  // Session creation...
});
```

**After:**
```javascript
} // End of if (needsFeeds)

// Update last login for demo user
db.updateUserLastLogin(demoUser.id);  // <-- Added

// Create session for demo user
req.login(demoUser, (err) => {
  // Session creation...
});
```

**Fix:** Added `updateUserLastLogin()` call for demo users before creating their session.

## Database Field
- **Table:** `users`
- **Column:** `last_login` (DATETIME)
- **Default:** `CURRENT_TIMESTAMP`
- **Updated by:** `db.updateUserLastLogin(userId)` method

## Testing Checklist
- [ ] Log in with Google account - verify `last_login` is updated
- [ ] Log in with demo account - verify `last_login` is updated
- [ ] Log in multiple times and check `last_login` timestamp changes
- [ ] Query database: `SELECT email, last_login FROM users;`

## Deployment
1. Deploy updated backend/server.js
2. Build Docker image
3. Restart containers
4. Test login flow

All login paths now properly track user login activity.
