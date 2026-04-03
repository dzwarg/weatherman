import { validateRecommendationRequest } from '../../src/validators/recommendationValidator.js';
import { generateRecommendations } from '../../src/services/recommendationService.js';
import { USER_PROFILES } from '../../src/config/constants.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function handleError(error) {
  const statusCode = error.statusCode || error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';

  return buildResponse(statusCode, {
    error: {
      code,
      message: error.message || 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  });
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, {});
  }

  try {
    if (event.httpMethod === 'GET') {
      return buildResponse(200, {
        profiles: USER_PROFILES,
      });
    }

    if (event.httpMethod !== 'POST') {
      return buildResponse(405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `${event.httpMethod} method is not supported for this endpoint. Use POST instead.`,
        },
        allowedMethods: ['POST'],
        timestamp: new Date().toISOString(),
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const validation = validateRecommendationRequest(body);
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(', '));
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      error.details = { field: 'body', errors: validation.errors };
      return handleError(error);
    }

    const recommendations = await generateRecommendations(body);

    return buildResponse(200, recommendations);
  } catch (error) {
    console.error('Recommendations error:', {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
    });
    return handleError(error);
  }
};
