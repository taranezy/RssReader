/**
 * OAuth Error Handler Middleware
 * Handles missing or invalid OAuth credentials gracefully
 */

module.exports = function createOAuthErrorHandler(config) {
  return (err, req, res, next) => {
    // Check if this is an OAuth-related error
    if (err && err.message && err.message.includes('OAuth')) {
      console.error('OAuth Error:', err.message);

      // Check if credentials are missing
      if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({
          success: false,
          error: 'Google OAuth is not configured',
          message: 'OAuth credentials are missing. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
          details: {
            missing: []
              .concat(!config.GOOGLE_CLIENT_ID ? ['GOOGLE_CLIENT_ID'] : [])
              .concat(!config.GOOGLE_CLIENT_SECRET ? ['GOOGLE_CLIENT_SECRET'] : [])
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: 'OAuth configuration error',
        message: err.message
      });
    }

    // Pass to next middleware if not an OAuth error
    next(err);
  };
};
