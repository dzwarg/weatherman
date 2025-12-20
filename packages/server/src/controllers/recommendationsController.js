import { validateRecommendationRequest } from '../validators/recommendationValidator.js';
import { generateRecommendations } from '../services/recommendationService.js';
import { APIError } from '../middleware/errorHandler.js';
import { USER_PROFILES } from '../config/constants.js';

/**
 * Recommendations controller
 * Handles recommendation API endpoint requests
 */

/**
 * Generate clothing recommendations
 * POST /api/recommendations
 */
export async function getRecommendations(req, res, next) {
  try {
    // Validate request
    const validation = validateRecommendationRequest(req.body);
    if (!validation.isValid) {
      throw new APIError(
        validation.errors.join(', '),
        400,
        'INVALID_REQUEST',
        { field: 'body', errors: validation.errors }
      );
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(req.body);

    // Return recommendations
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
}

/**
 * Get available user profiles
 * GET /api/recommendations/profiles
 */
export async function getProfiles(req, res, next) {
  try {
    res.json({
      profiles: USER_PROFILES,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getRecommendations,
  getProfiles,
};
