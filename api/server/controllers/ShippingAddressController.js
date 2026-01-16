import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import CommonService from '../services/common.js';

class ShippingAddressController {
  // ADD NEW ADDRESS
  async add(req, res) {
    try {
      const payload = {
        customer_id: req.user.id,

        // Common fields
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        // zip_code: req.body.zip_code,
        country: req.body.country,
        phone_number: req.body.phone_number,
        address_type: req.body.address_type,
        is_default_address: req.body.is_default_address ?? false,
        latitude: req.body.latitude ?? null,
        longitude: req.body.longitude ?? null,
        landmark: req.body.landmark,
        street: req.body.street,
        address_label: req.body.address_label,
        Housename: req.body.Housename,
        building_name: req.body.building_name,
        apartment_number: req.body.apartment_number,
        company_name: req.body.company_name,
        floor: req.body.floor,
        additional_directions: req.body.additional_directions
      };

      const created = await CommonService.create('ShippingAddress', payload);

      return res.status(httpStatus.OK).json(
        new APIResponse(created, 'Shipping address added successfully.', httpStatus.OK)
      );
    } catch (error) {
      console.error('ADD ADDRESS ERROR:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to add address.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // UPDATE ADDRESS
  async update(req, res) {
    try {
      const { id } = req.params;

      const address = await CommonService.getSingleRecordByCondition('ShippingAddress', {
        id,
        customer_id: req.user.id
      });

      if (!address) {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({}, 'Address not found.', httpStatus.NOT_FOUND)
        );
      }

      const updateData = {
        name: req.body.name ?? address.name,
        address: req.body.address ?? address.address,
        city: req.body.city ?? address.city,
        // zip_code: req.body.zip_code ?? address.zip_code,
        country: req.body.country ?? address.country,
        phone_number: req.body.phone_number ?? address.phone_number,
        address_type: req.body.address_type ?? address.address_type,
        is_default_address: req.body.is_default_address ?? address.is_default_address,
        latitude: req.body.latitude ?? address.latitude,
        longitude: req.body.longitude ?? address.longitude,
        landmark: req.body.landmark ?? address.landmark,
        street: req.body.street ?? address.street,
        address_label: req.body.address_label ?? address.address_label,
        Housename: req.body.Housename ?? address.Housename,
        building_name: req.body.building_name ?? address.building_name,
        apartment_number: req.body.apartment_number ?? address.apartment_number,
        company_name: req.body.company_name ?? address.company_name,
        floor: req.body.floor ?? address.floor,
        additional_directions: req.body.additional_directions ?? address.additional_directions
      };

      const updated = await CommonService.update('ShippingAddress', id, updateData);

      return res.status(httpStatus.OK).json(
        new APIResponse(updated, 'Shipping address updated successfully.', httpStatus.OK)
      );
    } catch (error) {
      console.error('UPDATE ADDRESS ERROR:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to update address.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // DELETE ADDRESS
  async delete(req, res) {
    try {
      const { id } = req.params;

      const address = await CommonService.getSingleRecordByCondition('ShippingAddress', {
        id,
        customer_id: req.user.id
      });

      if (!address) {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({}, 'Address not found.', httpStatus.NOT_FOUND)
        );
      }

      await CommonService.deleteById('ShippingAddress', id);

      return res.status(httpStatus.OK).json(
        new APIResponse({}, 'Shipping address deleted successfully.', httpStatus.OK)
      );
    } catch (error) {
      console.error('DELETE ADDRESS ERROR:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to delete address.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // GET ALL ADDRESSES FOR CUSTOMER
  async getByCustomerId(req, res) {
    try {
      const addresses = await CommonService.getMultipleRecordsByCondition('ShippingAddress', {
        customer_id: req.user.id
      });

      return res.status(httpStatus.OK).json(
        new APIResponse(addresses, 'Addresses fetched successfully.', httpStatus.OK)
      );
    } catch (error) {
      console.error('FETCH ADDRESSES ERROR:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch addresses.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
}

export default new ShippingAddressController();