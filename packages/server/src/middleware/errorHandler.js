/**
 * Global error handling middleware
 * Provides standardized error responses
 */

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  };

  // Add details if available
  if (err.details) {
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
