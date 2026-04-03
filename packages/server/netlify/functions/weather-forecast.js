import { validateWeatherRequest } from '../../src/validators/weatherValidator.js';
import { getForecast } from '../../src/services/weatherProxyService.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const body = event.body ? JSON.parse(event.body) : {};

    const validation = validateWeatherRequest(body);
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(', '));
      error.statusCode = 400;
      error.code = 'INVALID_REQUEST';
      error.details = { field: 'body', errors: validation.errors };
      return handleError(error);
    }

    const { lat, lon, units = 'imperial' } = body;
    const forecastData = await getForecast(lat, lon, units);

    return buildResponse(200, forecastData);
  } catch (error) {
    console.error('Weather forecast error:', {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
    });
    return handleError(error);
  }
};
