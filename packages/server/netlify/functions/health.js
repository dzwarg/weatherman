import { checkHealth as checkClaudeHealth } from '../../src/services/claudeService.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, {});
  }

  if (event.httpMethod !== 'GET') {
    return buildResponse(405, {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `${event.httpMethod} method is not supported. Use GET instead.`,
      },
      allowedMethods: ['GET'],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const claudeAvailable = await checkClaudeHealth();
    const weatherAvailable = true;

    return buildResponse(200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        weatherAPI: weatherAvailable ? 'available' : 'unavailable',
        claudeAPI: claudeAvailable ? 'available' : 'unavailable',
      },
    });
  } catch {
    return buildResponse(200, {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        weatherAPI: 'available',
        claudeAPI: 'unavailable',
      },
    });
  }
};
