import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import { Op } from 'sequelize';
import database from '../models/index.js';

class PharmacyController {
  // GET /pharmacy/categories → Quick links (Top, Skin Care, Pain Relief, etc.)
  async getCategories(req, res) {
    try {
      const categories = await database.PharmacyCategory.findAll({
        where: { deleted_at: null },
        attributes: ['id', 'name', 'icon', 'is_quick_link', 'sort_order'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
      });

      const processed = categories.map(cat => {
        const data = cat.toJSON();
        if (data.icon) {
          data.icon = `${process.env.IMAGE_PATH}/pharmacy-categories/${data.icon}`;
        }
        return data;
      });

      return res.status(httpStatus.OK).json(
        new APIResponse(processed, 'Pharmacy categories fetched successfully', httpStatus.OK)
      );
    } catch (error) {
      console.error('getCategories error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch categories', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // GET /pharmacy/brands → Top brands (Neutrogena, Panadol, etc.)
  async getBrands(req, res) {
    try {
      const brands = await database.PharmacyBrand.findAll({
        where: { deleted_at: null },
        attributes: ['id', 'name', 'logo'],
        order: [['name', 'ASC']],
      });

      const processed = brands.map(brand => {
        const data = brand.toJSON();
        if (data.logo) {
          data.logo = `${process.env.IMAGE_PATH}/pharmacy-brands/${data.logo}`;
        }
        return data;
      });

      return res.status(httpStatus.OK).json(
        new APIResponse(processed, 'Pharmacy brands fetched successfully', httpStatus.OK)
      );
    } catch (error) {
      console.error('getBrands error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch brands', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // GET /pharmacy/products/:id → Product detail + available pharmacies
    async getProductDetails(req, res) {
    try {
        const { id } = req.params;

        const product = await database.PharmacyProduct.findByPk(id, {
        attributes: [
            'id', 'name', 'description', 'image', 'base_price', 'selling_price',
            'is_prescription_required', 'stock_global'
        ],
        include: [
            {
            model: database.PharmacyCategory,
            as: 'category',
            attributes: ['id', 'name', 'icon']
            },
            {
            model: database.PharmacyBrand,
            as: 'brand',
            attributes: ['id', 'name', 'logo']
            },
            {
            model: database.PharmacyInventory,
            as: 'inventory',
            attributes: ['pharmacy_id', 'stock', 'price'],
            required: false,  // ← Important: allow products with no inventory
            include: [
                {
                model: database.Establishment,
                as: 'pharmacy',
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'primary_photo']
                }
            ]
            }
        ]
        });

        if (!product) {
        return res.status(httpStatus.NOT_FOUND).json(
            new APIResponse({}, 'Product not found', httpStatus.NOT_FOUND)
        );
        }

        const data = product.toJSON();

        // Product image
        if (data.image) {
        data.image = `${process.env.IMAGE_PATH}/pharmacy-products/${data.image}`;
        }

        // Category & Brand
        if (data.category?.icon) {
        data.category.icon = `${process.env.IMAGE_PATH}/pharmacy-categories/${data.category.icon}`;
        }
        if (data.brand?.logo) {
        data.brand.logo = `${process.env.IMAGE_PATH}/pharmacy-brands/${data.brand.logo}`;
        }

        // Pharmacies via inventory
        if (data.inventory) {
        data.pharmacies = data.inventory.map(inv => {
            const ph = inv.pharmacy;
            if (ph?.primary_photo) {
            ph.photo_url = `${process.env.IMAGE_PATH}/establishment/${ph.primary_photo}`;
            }
            return {
            pharmacy_id: inv.pharmacy_id,
            stock: inv.stock,
            price: inv.price,
            pharmacy: ph
            };
        });
        delete data.inventory;
        } else {
        data.pharmacies = [];
        }

        return res.status(httpStatus.OK).json(
        new APIResponse(data, 'Product details fetched successfully', httpStatus.OK)
        );

    } catch (error) {
        console.error('getProductDetails error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch product details', httpStatus.INTERNAL_SERVER_ERROR)
        );
    }
    }

  // GET /pharmacy/pharmacies/:id → Pharmacy detail + available products
  async getPharmacyDetails(req, res) {
    try {
      const { id } = req.params;

      const pharmacy = await database.Establishment.findOne({
        where: {
          id,
          establishment_type: 4,
          deleted_at: null
        },
        attributes: [
          'id', 'name', 'address', 'latitude', 'longitude', 'primary_photo',
          'contact_number', 'about', 'is_24_by_7_working'
        ],
        include: [
          {
            model: database.EstablishmentWorkingHour,
            as: 'workingHoursDetails',
            attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
            separate: true
          },
          {
            model: database.PharmacyProduct,
            as: 'products',
            attributes: ['id', 'name', 'image', 'base_price', 'selling_price', 'is_prescription_required'],
            through: {
              attributes: ['stock', 'price'],
              as: 'inventory'
            }
          }
        ]
      });

      if (!pharmacy) {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({}, 'Pharmacy not found', httpStatus.NOT_FOUND)
        );
      }

      const data = pharmacy.toJSON();

      // Primary photo
      if (data.primary_photo) {
        data.photo_url = `${process.env.IMAGE_PATH}/establishment/${data.primary_photo}`;
      }

      // Working hours
      if (data.workingHoursDetails) {
        data.workingHoursDetails = data.workingHoursDetails.map(h => ({
          day_of_week: +h.day_of_week,
          start_time: h.start_time?.toString().slice(0, 5) || null,
          end_time: h.end_time?.toString().slice(0, 5) || null,
          is_day_off: h.is_day_off === '1' || h.is_day_off === 1
        }));
      }

      // Products
      if (data.products) {
        data.products = data.products.map(p => {
          const inventory = p.inventory || {};
          if (p.image) {
            p.image_url = `${process.env.IMAGE_PATH}/pharmacy-products/${p.image}`;
          }
          p.stock = inventory.stock || 0;
          p.price = inventory.price || p.selling_price;
          delete p.inventory;
          delete p.PharmacyInventory;
          return p;
        });
      }

      return res.status(httpStatus.OK).json(
        new APIResponse(data, 'Pharmacy details fetched successfully', httpStatus.OK)
      );
    } catch (error) {
      console.error('getPharmacyDetails error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch pharmacy details', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

    /* =========================================
     GET CART
  ========================================== */
  async getCart(req, res) {
    try {
      const userId = req.user.id;

      const cart = await database.PharmacyCart.findOne({
        where: { customer_id: userId },
        include: [
          {
            model: database.PharmacyCartItem,
            as: 'items',
            include: [
              {
                model: database.PharmacyProduct,
                as: 'product',
              }
            ]
          }
        ]
      });

      return res.status(httpStatus.OK).json(
        new APIResponse(cart || { items: [] }, 'Cart fetched', httpStatus.OK)
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        new APIResponse({}, 'Failed to fetch cart', 500)
      );
    }
  }

  /* =========================================
     ADD TO CART
  ========================================== */
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, pharmacy_id, quantity } = req.body;

      if (!product_id || !pharmacy_id || !quantity) {
        return res.status(400).json(
          new APIResponse({}, 'product_id, pharmacy_id, quantity required', 400)
        );
      }

      // Get or create cart
      let cart = await database.PharmacyCart.findOne({
        where: { customer_id: userId }
      });

      if (!cart) {
        cart = await database.PharmacyCart.create({
          customer_id: userId
        });
      }

      // Check if item already exists
      let item = await database.PharmacyCartItem.findOne({
        where: {
          cart_id: cart.id,
          product_id,
          pharmacy_id
        }
      });

      if (item) {
        item.quantity += quantity;
        await item.save();
      } else {
        await database.PharmacyCartItem.create({
          cart_id: cart.id,
          product_id,
          pharmacy_id,
          quantity
        });
      }

      return res.status(200).json(
        new APIResponse({}, 'Item added to cart', 200)
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        new APIResponse({}, 'Add to cart failed', 500)
      );
    }
  }

  /* =========================================
     UPDATE CART ITEM
  ========================================== */
  async updateCartItem(req, res) {
    try {
      const { itemId, quantity } = req.body;

      const item = await database.PharmacyCartItem.findByPk(itemId);
      if (!item) {
        return res.status(404).json(
          new APIResponse({}, 'Cart item not found', 404)
        );
      }

      item.quantity = quantity;
      await item.save();

      return res.status(200).json(
        new APIResponse({}, 'Cart updated', 200)
      );
    } catch (error) {
      return res.status(500).json(
        new APIResponse({}, 'Update failed', 500)
      );
    }
  }
  async removeCartItem(req, res) {
    try {
      const { itemId } = req.params;

      await database.PharmacyCartItem.destroy({
        where: { id: itemId }
      });

      return res.status(200).json(
        new APIResponse({}, 'Item removed', 200)
      );
    } catch (error) {
      return res.status(500).json(
        new APIResponse({}, 'Remove failed', 500)
      );
    }
  }

  /* =========================================
     CLEAR CART
  ========================================== */
  async clearCart(req, res) {
    try {
      const cart = await database.PharmacyCart.findOne({
        where: { customer_id: req.user.id }
      });

      if (cart) {
        await database.PharmacyCartItem.destroy({
          where: { cart_id: cart.id }
        });
      }

      return res.status(200).json(
        new APIResponse({}, 'Cart cleared', 200)
      );
    } catch (error) {
      return res.status(500).json(
        new APIResponse({}, 'Clear cart failed', 500)
      );
    }
  }

  /* =========================================
     CHECKOUT
  ========================================== */
  async checkout(req, res) {
    try {
      const userId = req.user.id;

      const cart = await database.PharmacyCart.findOne({
        where: { customer_id: userId },
        include: [{ model: database.PharmacyCartItem, as: 'items' }]
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json(
          new APIResponse({}, 'Cart is empty', 400)
        );
      }

      // Create order
      const order = await database.PharmacyOrder.create({
        customer_id: userId,
        status: 'pending'
      });

      // Move cart items → order items
      for (const item of cart.items) {
        await database.PharmacyOrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          pharmacy_id: item.pharmacy_id,
          quantity: item.quantity
        });
      }

      // Clear cart
      await database.PharmacyCartItem.destroy({
        where: { cart_id: cart.id }
      });

      return res.status(200).json(
        new APIResponse(order, 'Order placed successfully', 200)
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        new APIResponse({}, 'Checkout failed', 500)
      );
    }
  }

  /* =========================================
     ORDER LIST
  ========================================== */
  async getOrders(req, res) {
    const orders = await database.PharmacyOrder.findAll({
      where: { customer_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(
      new APIResponse(orders, 'Orders fetched', 200)
    );
  }

  async getOrderDetails(req, res) {
    const order = await database.PharmacyOrder.findByPk(req.params.orderId, {
      include: [{ model: database.PharmacyOrderItem, as: 'items' }]
    });

    return res.status(200).json(
      new APIResponse(order, 'Order details', 200)
    );
  }

}

export default new PharmacyController();