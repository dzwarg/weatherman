/**
 * Request logging middleware
 * Logs all incoming HTTP requests
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log(`${log.method} ${log.path} ${log.statusCode} - ${log.duration}`);
  });

  next();
};

export default requestLogger;
