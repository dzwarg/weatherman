/**
 * Global error handling middleware
 * Provides standardized error responses
 */

export const errorHandler = (err, req, res, _next) => {
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Log error for debugging (hide sensitive info in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    // Production: Only log essential info (no stack traces)
    console.error('Error:', {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }

  // Build error response
  const errorResponse = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  };

  // Add details if available (only in development, test, or if explicitly safe)
  if (err.details && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || err.safeDetails)) {
    errorResponse.error.details = err.details;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export default errorHandler;
