import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import FavoriteService from '../services/favourite.js';

class FavoriteController {
  // Add item to favorites
  async addToFavorites(req, res) {
    try {
      const { customer_id, type, reference_id } = req.body;

      const result = await FavoriteService.addToFavorites(
        customer_id,
        type,
        reference_id
      );

      return res
        .status(httpStatus.CREATED)
        .json(
          new APIResponse(
            result,
            'Item added to favorites successfully',
            httpStatus.CREATED
          )
        );
    } catch (error) {
      if (error.message === 'Item is already in favorites') {
        return res
          .status(httpStatus.CONFLICT)
          .json(
            new APIResponse(
              {},
              'Item is already in favorites',
              httpStatus.CONFLICT
            )
          );
      }

      if (error.message.includes('not found')) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              {},
              error.message,
              httpStatus.NOT_FOUND
            )
          );
      }

      console.error('Error adding to favorites:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            'Failed to add item to favorites',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  // Remove item from favorites (permanent delete)
  async removeFromFavorites(req, res) {
    try {
      const { customer_id, type, reference_id } = req.body;

      const result = await FavoriteService.removeFromFavorites(
        customer_id,
        type,
        reference_id
      );

      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            result,
            'Item removed from favorites successfully',
            httpStatus.OK
          )
        );
    } catch (error) {
      if (error.message === 'Favorite not found') {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              {},
              'Favorite not found',
              httpStatus.NOT_FOUND
            )
          );
      }

      console.error('Error removing from favorites:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            'Failed to remove item from favorites',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  // Get user's favorites with full entity details
  async getFavorites(req, res) {
    try {
      const { customer_id, type, reference_id } = req.query;

      if (!customer_id) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(
            new APIResponse(
              {},
              'customer_id is required',
              httpStatus.BAD_REQUEST
            )
          );
      }

      const result = await FavoriteService.getFavoritesWithDetails(
        parseInt(customer_id),
        type,
        reference_id
      );

      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            result,
            'Favorites retrieved successfully',
            httpStatus.OK
          )
        );
    } catch (error) {
      console.error('Error getting favorites:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            'Failed to retrieve favorites',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async checkFavoriteStatus(req, res) {
    try {
      const { customer_id, type, reference_id } = req.query;

      // Validate required parameters
      if (!customer_id || !type || !reference_id) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(
            new APIResponse(
              {},
              'customer_id, type, and reference_id are required',
              httpStatus.BAD_REQUEST
            )
          );
      }

      // Validate type
      const validTypes = ['doctor', 'hospital', 'service', 'speciality', 'clinic', 'pharmacy'];
      if (!validTypes.includes(type)) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(
            new APIResponse(
              {},
              'Invalid type. Must be one of: doctor, hospital, service, speciality, clinic',
              httpStatus.BAD_REQUEST
            )
          );
      }

      const isFavorite = await FavoriteService.checkFavoriteStatus(
        parseInt(customer_id),
        type,
        parseInt(reference_id)
      );

      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            { isFavorite },
            'Favorite status retrieved successfully',
            httpStatus.OK
          )
        );
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            'Failed to check favorite status',
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
}

export default new FavoriteController();