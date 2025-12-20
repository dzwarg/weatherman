/**
 * Weather request validator
 * Validates incoming weather API requests
 */

export function validateWeatherRequest(request) {
  const errors = [];

  // Validate latitude
  if (request.lat === undefined || request.lat === null) {
    errors.push('Latitude is required');
  } else if (typeof request.lat !== 'number') {
    errors.push('Latitude must be a number');
  } else if (request.lat < -90 || request.lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  // Validate longitude
  if (request.lon === undefined || request.lon === null) {
    errors.push('Longitude is required');
  } else if (typeof request.lon !== 'number') {
    errors.push('Longitude must be a number');
  } else if (request.lon < -180 || request.lon > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  // Validate units (optional, defaults to imperial)
  if (request.units !== undefined) {
    if (!['imperial', 'metric'].includes(request.units)) {
      errors.push('Units must be either "imperial" or "metric"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export default validateWeatherRequest;
