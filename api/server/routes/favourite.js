import express from 'express';
import FavoriteController from '../controllers/FavouriteController.js';
import { routeValidator } from '../utils/routeValidator.js';
import enums from '../utils/utils.js';
import Validators from '../validators/user.js';

const router = express.Router();

// Routes - Only 3 APIs as requested

// Add item to favorites
router.post(
  '/add',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.addFavoriteValidator),
  FavoriteController.addToFavorites
);

// Remove item from favorites (permanent delete)
router.delete(
  '/remove',
  routeValidator(enums.PAYLOAD_TYPE.BODY, Validators.removeFavoriteValidator),
  FavoriteController.removeFromFavorites
);

// Get user's favorites with full entity details
router.get(
  '/list',
  FavoriteController.getFavorites
);

router.get(
  '/check',
  routeValidator(enums.PAYLOAD_TYPE.QUERY, Validators.checkFavoriteStatusValidator),
  FavoriteController.checkFavoriteStatus
);

export default router;