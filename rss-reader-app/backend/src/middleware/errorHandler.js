/**
 * Error Handler Middleware - Centralized error handling
 * Single Responsibility: Handle and format errors consistently
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: err.message
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      details: err.message
    });
  }

  // Generic server error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
