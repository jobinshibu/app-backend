import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import db from '../models/index.js';
import { Op } from 'sequelize';

class MyGarageController {


    async getVehicleById(req, res, next) {
        try {
            const { id: customer_id } = req.user;
            const { id } = req.params;

            const vehicle = await db.MyGarage.findOne({
                where: { id, customer_id },
                include: [
                    { model: db.Brands, as: 'brand', attributes: ['id', 'name', 'icon'] },
                    { model: db.Models, as: 'model', attributes: ['id', 'name', 'variant', 'transmission_type'] }
                ]
            });

            if (!vehicle) {
                return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, "Vehicle not found", httpStatus.NOT_FOUND));
            }

            return res.status(httpStatus.OK).json(new APIResponse(vehicle, "Vehicle fetched successfully", httpStatus.OK));

        } catch (error) {
            console.error("Error fetching vehicle:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, error.message, httpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async getMyVehicles(req, res, next) {
        try {
            const { id: customer_id } = req.user;

            const vehicles = await db.MyGarage.findAll({
                where: { customer_id },
                include: [
                    { model: db.Brands, as: 'brand', attributes: ['id', 'name', 'icon'] },
                    { model: db.Models, as: 'model', attributes: ['id', 'name', 'variant', 'transmission_type'] }
                ],
                order: [['created_at', 'DESC']]
            });

            return res.status(httpStatus.OK).json(new APIResponse(vehicles, "Vehicles fetched successfully", httpStatus.OK));

        } catch (error) {
            console.error("Error fetching vehicles:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, error.message, httpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async getBrands(req, res, next) {
        try {
            const brands = await db.Brands.findAll({
                attributes: ['id', 'name', 'icon', 'description']
            });
            return res.status(httpStatus.OK).json(new APIResponse(brands, "Brands fetched successfully", httpStatus.OK));
        } catch (error) {
            console.error("Error fetching brands:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, "Server Error", httpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async getModelsByBrand(req, res, next) {
        try {
            const { brand_id } = req.query;
            if (!brand_id) {
                return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, "Brand ID is required", httpStatus.BAD_REQUEST));
            }

            const models = await db.Models.findAll({
                where: { brand_id: brand_id },
                attributes: ['id', 'name', 'transmission_type', 'variant']
            });
            return res.status(httpStatus.OK).json(new APIResponse(models, "Models fetched successfully", httpStatus.OK));
        } catch (error) {
            console.error("Error fetching models:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, "Server Error", httpStatus.INTERNAL_SERVER_ERROR));
        }
    }
    
    async addVehicle(req, res, next) {
        try {
            const { id: customer_id } = req.user; // Assuming auth middleware populates req.user
            const { type, brand_id, model_id, country, emirates, plate_code, plate_number, color, fuel_type } = req.body;

            // Basic validation
            if (!type || !brand_id || !model_id) {
                return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, "Type, Brand, and Model are required", httpStatus.BAD_REQUEST));
            }

            const newVehicle = await db.MyGarage.create({
                customer_id,
                type,
                brand_id,
                model_id,
                country,
                emirates,
                plate_code,
                plate_number,
                color,
                fuel_type
            });

            return res.status(httpStatus.CREATED).json(new APIResponse(newVehicle, "Vehicle added successfully", httpStatus.CREATED));

        } catch (error) {
            console.error("Error adding vehicle:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, error.message, httpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async updateVehicle(req, res, next) {
        try {
            const { id: customer_id } = req.user;
            const { id } = req.params;
            const updateData = req.body;

            const vehicle = await db.MyGarage.findOne({ where: { id, customer_id } });

            if (!vehicle) {
                return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, "Vehicle not found", httpStatus.NOT_FOUND));
            }

            await vehicle.update(updateData);

            return res.status(httpStatus.OK).json(new APIResponse(vehicle, "Vehicle updated successfully", httpStatus.OK));

        } catch (error) {
            console.error("Error updating vehicle:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, error.message, httpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    async deleteVehicle(req, res, next) {
        try {
            const { id: customer_id } = req.user;
            const { id } = req.params;

            const vehicle = await db.MyGarage.findOne({ where: { id, customer_id } });

            if (!vehicle) {
                return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, "Vehicle not found", httpStatus.NOT_FOUND));
            }

            await vehicle.destroy();
            return res.status(httpStatus.OK).json(new APIResponse({}, "Vehicle deleted successfully", httpStatus.OK));

        } catch (error) {
            console.error("Error deleting vehicle:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, error.message, httpStatus.INTERNAL_SERVER_ERROR));
        }
    }
}

export default new MyGarageController();
