/**
 * Authentication Middleware - Verify user is authenticated
 * Single Responsibility: Check authentication state
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Allow demo and proxy routes
  if (req.path.startsWith('/api/auth/demo') || 
      req.path.startsWith('/api/proxy/') ||
      req.path === '/api/health') {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Not authenticated. Please log in first.'
  });
}

module.exports = isAuthenticated;
