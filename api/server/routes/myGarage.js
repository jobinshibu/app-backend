import express from 'express';
import MyGarageController from '../controllers/MyGarageController.js';

const router = express.Router();

// Dropdowns
router.get('/brands', MyGarageController.getBrands);
router.get('/models', MyGarageController.getModelsByBrand);

// CRUD
router.get('/', MyGarageController.getMyVehicles);
router.get('/:id', MyGarageController.getVehicleById);
router.post('/', MyGarageController.addVehicle);
router.put('/:id', MyGarageController.updateVehicle);
router.delete('/:id', MyGarageController.deleteVehicle);

export default router;
