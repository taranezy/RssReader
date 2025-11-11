/**
 * Logger Middleware - Log HTTP requests and responses
 * Single Responsibility: Request/response logging
 */
function logger(req, res, next) {
  const start = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    res.send = originalSend;
    return res.send(data);
  };

  next();
}

module.exports = logger;
