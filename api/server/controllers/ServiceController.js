import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import CommonService from '../services/common.js';
import { Op } from 'sequelize';
import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
// ⭐ NEW LINE — import email service at top of controller
import { sendBookingEmails } from "../services/EmailService.js";
import NotificationService from '../services/notificationService.js';
import { sendAdminNotification } from '../utils/adminNotifier.js';
// import { required } from 'joi';


function formatDate(d) {
  if (!d) return "";
  const dateObj = new Date(d);

  const options = { day: "2-digit", month: "short", year: "numeric" };
  return dateObj.toLocaleDateString("en-GB", options);
  // Example: "08 Dec 2025"
}

function computePackageReminderTime(booked_date, slot) {
  if (!booked_date || !slot) return null;

  try {
    const slotStart = String(slot).split(/-|to/i)[0].trim(); // "10:00"
    const [hStr, mStr = "0"] = slotStart.split(":");
    const hours = Number(hStr);
    const minutes = Number(mStr);

    if (isNaN(hours) || isNaN(minutes)) return null;

    const appt = new Date(booked_date);
    appt.setHours(hours, minutes, 0, 0);

    return new Date(appt.getTime() - 60 * 60 * 1000); // 1 hr before
  } catch (e) {
    console.error("computePackageReminderTime error:", e);
    return null;
  }
}

class ServiceController {

  async listPackages(req, res) {
    try {
      const {
        search,
        establishment_id,
      } = req.query;

      const where = { visible: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { sub_title: { [Op.like]: `%${search}%` } }
        ];
      }

      if (establishment_id) {
        where.establishment_id = establishment_id;
      }

      const { count, rows } = await database.Package.findAndCountAll({
        where,
        attributes: [
          'id', 'name', 'sub_title', 'selling_price', 'strike_price',
          'discount_text', 'image', 'service_duration_minutes', 'sla', 'sla_unit', 'demographics', 'type',
          'category_id', 'result_time', 'recommended', 'top_packages', 'tag', 'instructionBeforeTest'
        ],
        include: [
          {
            model: database.Establishment,
            as: 'establishment',
            attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'is_24_by_7_working'],
            // include: [
            //   {
            //     model: database.EstablishmentWorkingHour,
            //     as: 'workingHoursDetails',
            //     attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
            //     separate : true,
            //     required: false
            //   }
            // ]
          },
          {
            model: database.Biomarker,
            as: 'biomarkers',
            attributes: [],
            through: { attributes: [] }
          }
        ],
        // group: ['Package.id', 'establishment.id'],
        // subQuery: false
      });

      // FINAL: ONE PASS → HOURS + BADGE
      const packages = await Promise.all(
        rows.map(async (pkg) => {
          const data = pkg.toJSON();

          // 1. Ensure establishment exists
          if (!data.establishment) {
            data.establishment = { workingHoursDetails: [] };
          }

          // 2. Load working hours
          if (data.establishment.id) {
            const hours = await database.EstablishmentWorkingHour.findAll({
              where: { establishment_id: data.establishment.id },
              attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
              order: [['day_of_week', 'ASC']],
              raw: true
            });
            data.establishment.workingHoursDetails = hours.map(h => ({
              day_of_week: +h.day_of_week,
              start_time: h.start_time.toString().slice(0, 5),
              end_time: h.end_time.toString().slice(0, 5),
              is_day_off: h.is_day_off === '1' || h.is_day_off === 1
            }));
          } else {
            data.establishment.workingHoursDetails = [];
          }

          // 3. Bookings badge
          const completed = await database.PackageBooking.count({
            where: { package_id: data.id, booking_status: 1 }
          });
          const badge = (Math.floor(completed / 10) * 10) + '+';

          return {
            ...data,
            total_biomarkers: data.biomarkers?.length || 0,
            bookings_badge: badge,
            reviews: 16,
            rating: 4.5
          };
        })
      );

      return res.status(httpStatus.OK).json(new APIResponse({
        data: packages,
        count: { total: count }
      }, 'Packages listed successfully', httpStatus.OK));

    } catch (error) {
      console.error('listPackages error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to list packages', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  async getPackageDetails(req, res) {
    try {
      const { id } = req.params;

      const pkg = await database.Package.findOne({
        where: { id, visible: true },
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: [
          {
            model: database.Establishment,
            as: 'establishment',
            attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'is_24_by_7_working'],
            required: false,
            include: [{
              model: database.EstablishmentWorkingHour,
              as: 'workingHoursDetails',
              attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
              required: false
            }]
          },
          // {
          //   model: database.Biomarker,
          //   as: 'biomarkers',
          //   through: { attributes: [] },
          //   required: false
          // },
          {
            model: database.BiomarkerGroup,
            as: 'groups',
            through: { attributes: [] },
            required: false,
            include: {
              model: database.Biomarker,
              as: 'biomarkers',
              through: { attributes: [] },
              required: false,
              // where: { '$Package.groups->PackageGroup.package_id$': id}
            }
          },
          {
            model: database.PackageAddon,
            as: 'addonDetails', // Make sure this alias exists in your model!
            attributes: ['id', 'biomarker_id', 'addon_package_id', 'group_id', 'recommended', 'why_recommended'],
            required: false,
            include: [
              {
                model: database.Biomarker,
                as: 'biomarkerInfo',
                attributes: ['id', 'name', 'type', 'description', 'specimen', 'unit', 'selling_price'],
              },
              {
                model: database.Package,
                as: 'addonPackageInfo',
                attributes: ['id', 'name', 'sub_title', 'selling_price', 'image'],
              },
              {
                model: database.BiomarkerGroup,
                as: 'groupInfo',
                attributes: ['id', 'name', 'description', 'selling_price'], // adjust if no selling_price
              }
            ]
          }
        ]
      });

      if (!pkg) {
        return res.status(404).json(new APIResponse({}, 'Package not found', 404));
      }

      const plainPkg = pkg.toJSON();

      // === UNIFIED ADD-ONS ARRAY ===
      const unifiedAddons = [];

      if (plainPkg.addonDetails && plainPkg.addonDetails.length > 0) {
        for (const addon of plainPkg.addonDetails) {
          if (addon.biomarkerInfo) {
            unifiedAddons.push({
              type: 'biomarker',
              addon_id: addon.id,
              id: addon.biomarkerInfo.id,
              name: addon.biomarkerInfo.name,
              type_detail: addon.biomarkerInfo.type,
              description: addon.biomarkerInfo.description,
              specimen: addon.biomarkerInfo.specimen,
              unit: addon.biomarkerInfo.unit,
              price: Number(addon.biomarkerInfo.selling_price) || 0,
              image: null,
              recommended: addon.recommended,
              why_recommended: addon.why_recommended || ''
            });
          }

          if (addon.addonPackageInfo) {
            unifiedAddons.push({
              type: 'package',
              addon_id: addon.id,
              id: addon.addonPackageInfo.id,
              name: addon.addonPackageInfo.name,
              sub_title: addon.addonPackageInfo.sub_title || '',
              price: Number(addon.addonPackageInfo.selling_price) || 0,
              image: addon.addonPackageInfo.image || null,
              recommended: addon.recommended,
              why_recommended: addon.why_recommended || ''
            });
          }

          if (addon.groupInfo) {
            unifiedAddons.push({
              type: 'group',
              addon_id: addon.id,
              id: addon.groupInfo.id,
              name: addon.groupInfo.name,
              description: addon.groupInfo.description || '',
              price: Number(addon.groupInfo.selling_price) || 0,
              image: null,
              recommended: addon.recommended,
              why_recommended: addon.why_recommended || ''
            });
          }
        }
      }

      plainPkg.addons = unifiedAddons;
      delete plainPkg.addonDetails;  // ← Clean up raw data

      // Get only biomarkers actually selected in this package
      const selectedBiomarkerIds = await database.sequelize.query(
        `SELECT biomarker_id FROM package_biomarkers WHERE package_id = :id`,
        { replacements: { id }, type: database.sequelize.QueryTypes.SELECT }
      ).then(rows => rows.map(r => r.biomarker_id));

      // Filter biomarkers in each group
      plainPkg.groups = (plainPkg.groups || []).map(group => ({
        ...group,
        biomarkers: (group.biomarkers || []).filter(bm => selectedBiomarkerIds.includes(bm.id))
      })).filter(group => group.biomarkers.length > 0);

      // Update count
      plainPkg.biomarkers_tested_count = plainPkg.groups.reduce((sum, g) => sum + g.biomarkers.length, 0);

      // Format working hours
      if (plainPkg.establishment?.workingHoursDetails?.length) {
        plainPkg.establishment.workingHoursDetails = plainPkg.establishment.workingHoursDetails.map(h => ({
          day_of_week: Number(h.day_of_week),
          start_time: h.start_time ? String(h.start_time).slice(0, 5) : null,
          end_time: h.end_time ? String(h.end_time).slice(0, 5) : null,
          is_day_off: Boolean(h.is_day_off)
        }));
      } else {
        plainPkg.establishment = plainPkg.establishment || {};
        plainPkg.establishment.workingHoursDetails = [];
      }

      // Badge
      const completed = await database.PackageBooking.count({
        where: { package_id: id, booking_status: 1 }
      });
      plainPkg.completed_bookings_badge = (Math.floor(completed / 10) * 10) + '+';

      // Clean numeric fields
      plainPkg.id = Number(plainPkg.id);
      plainPkg.base_price = Number(plainPkg.base_price) || 0;
      plainPkg.selling_price = Number(plainPkg.selling_price) || 0;

      // REMOVE DUPLICATE `biomarkers` ARRAY
      delete plainPkg.biomarkers;

      return res.status(200).json(new APIResponse(plainPkg, 'Package details fetched', 200));

    } catch (error) {
      console.error('getPackageDetails error:', error);
      return res.status(500).json(new APIResponse({}, 'Failed to fetch package details', 500));
    }
  }

  // ==================== PACKAGE BOOKING CRUD ====================

  async createPackageBooking(req, res) {
    try {
      let {
        package_id,
        bundle_purchase_item_id, // ← NEW: Optional
        customer_id,
        booked_date,
        slot,
        home_collection = false,
        payment_method,
        payment_id,
        patient_name,
        patient_age,
        patient_number,
        coupon_id,
        coupon_details,
        add_ons = [],
        customer_address_id,
      } = req.body;

      let fromBundle = false;
      let bundleItem = null;
      let packagePrice = 0;
      let addonsPrice = 0;
      let totalPrice = 0;

      // ================== BUNDLE USAGE CHECK (OPTIONAL) ==================
      if (bundle_purchase_item_id) {
        bundleItem = await database.BundlePurchaseItem.findOne({
          where: {
            id: bundle_purchase_item_id,
            remaining_qty: { [Op.gt]: 0 }
          },
          include: [{
            model: database.BundlePurchase,
            as: 'purchase',
            where: {
              customer_id, // <--- MOVED HERE (Correct)
              status: 'active',
              expiration_date: { [Op.gt]: new Date() }
            }
          }]
        });

        if (!bundleItem) {
          return res.status(400).json(new APIResponse({}, "Bundle item invalid, expired, or no remaining uses"));
        }

        fromBundle = true;
        package_id = bundleItem.package_id; // Override with bundle's package
        totalPrice = 0; // Free from bundle
        payment_method = 'bundle';
        payment_id = null;
      }

      // ================== FETCH MAIN PACKAGE ==================
      const mainPkg = await database.Package.findByPk(package_id, {
        attributes: ['id', 'name', 'selling_price']
      });
      if (!mainPkg) return res.status(400).json(new APIResponse({}, 'Invalid package'));

      if (!fromBundle) {
        packagePrice = Number(mainPkg.selling_price);
      }

      // ================== ADD-ONS → SNAPSHOT ==================
      const addonsSnapshot = [];

      if (add_ons.length > 0) {
        const validAddons = await database.PackageAddon.findAll({
          where: {
            package_id: package_id,
            id: add_ons
          },
          attributes: ['id', 'biomarker_id', 'addon_package_id', 'group_id', 'recommended', 'why_recommended']
        });

        if (validAddons.length !== add_ons.length) {
          return res.status(400).json(new APIResponse({}, 'One or more add-ons are invalid'));
        }

        for (const addon of validAddons) {
          let price = 0;
          let name = 'Unknown Add-on';

          if (addon.biomarker_id) {
            const b = await database.Biomarker.findByPk(addon.biomarker_id, { attributes: ['name', 'selling_price'] });
            if (b) { name = b.name; price = Number(b.selling_price) || 0; }
          } else if (addon.addon_package_id) {
            const p = await database.Package.findByPk(addon.addon_package_id, { attributes: ['name', 'selling_price'] });
            if (p) { name = p.name; price = Number(p.selling_price) || 0; }
          } else if (addon.group_id) {
            const g = await database.BiomarkerGroup.findByPk(addon.group_id, { attributes: ['name', 'selling_price'] });
            if (g) { name = g.name; price = Number(g.selling_price) || 0; }
          }

          addonsPrice += price;
          addonsSnapshot.push({
            mapping_id: addon.id,
            name,
            price,
            recommended: addon.recommended,
            why_recommended: addon.why_recommended || null
          });
        }
      }

      // Final price
      if (!fromBundle) {
        totalPrice = packagePrice + addonsPrice;
      }

      // ================== ADDRESS SNAPSHOT ==================
      let addressSnapshot = null;
      if (customer_address_id) {
        const addr = await database.ShippingAddress.findOne({
          where: { id: customer_address_id, customer_id },
          attributes: ['name', 'address', 'landmark', 'Housename', 'city', 'zip_code', 'phone_number', 'latitude', 'longitude']
        });
        if (!addr) return res.status(400).json(new APIResponse({}, 'Invalid address'));
        addressSnapshot = addr.toJSON();
      }

      // ================== REMINDER TIME ==================
      let reminder_time = computePackageReminderTime(booked_date, slot);
      let reminder_sent = false;
      const now = new Date();
      if (reminder_time && reminder_time < now) {
        reminder_sent = true;
        reminder_time = null;
      }

      // ================== CREATE BOOKING ==================
      const booking = await database.PackageBooking.create({
        customer_id,
        package_id,
        package_price: fromBundle ? 0 : packagePrice,
        addons_price: addonsPrice,
        total_price: totalPrice,
        addons_snapshot: addonsSnapshot,
        add_ons,
        customer_address_id,
        customer_address_snapshot: addressSnapshot,
        slot,
        booked_date,
        home_collection: Boolean(home_collection),
        payment_method,
        payment_id,
        patient_name,
        patient_age,
        patient_number,
        coupon_id,
        coupon_details,
        booking_status: 0,
        payment_status: fromBundle ? 1 : 0, // Paid via bundle
        reminder_time,
        reminder_sent
      });

      // ================== BUNDLE: DEDUCT QTY & LOG HISTORY ==================
      if (fromBundle && bundleItem) {
        await bundleItem.decrement('remaining_qty');

        await database.BundleUsageHistory.create({
          purchase_item_id: bundleItem.id,
          booking_id: booking.id,
          usage_date: new Date()
        });
      }

      // ================== RETURN FULL BOOKING ==================
      const full = await database.PackageBooking.findOne({
        where: { id: booking.id },
        include: [
          { model: database.Package, as: 'packageInfo', attributes: ['id', 'name', 'sub_title', 'image'] },
          { model: database.Customer, as: 'customer' },
          { model: database.ShippingAddress, as: 'customerAddress' }
        ]
      });

      const json = full.toJSON();

      if (json.customer) {
        json.customer.name = `${json.customer.first_name || ''} ${json.customer.last_name || ''}`.trim();
        json.customer.phone = `${json.customer.mobile_country_code || ''}${json.customer.mobile_no || ''}`.trim();
        delete json.customer.first_name;
        delete json.customer.last_name;
        delete json.customer.mobile_country_code;
        delete json.customer.mobile_no;
      }

      json.pricing = {
        package: json.package_price,
        addons: json.addons_price,
        total: json.total_price,
        addons_details: json.addons_snapshot
      };

      json.delivery_address = json.customerAddress || json.customer_address_snapshot;

      return res.status(200).json(new APIResponse(json, 'Booking created successfully'));

    } catch (error) {
      console.error('createPackageBooking:', error);
      return res.status(500).json(new APIResponse({}, 'Failed to create booking'));
    }
  }

  async listPackageBookings(req, res) {
    const { customerId } = req.params;
    const { status } = req.query;

    const where = { customer_id: customerId };
    if (status) where.payment_status = status;

    const bookings = await database.PackageBooking.findAll({
      where,
      include: [
        { model: database.Package, as: 'packageInfo', include: [{ model: database.Establishment, as: 'establishment', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] }] },
        { model: database.Customer, as: 'customer' },
        { model: database.ShippingAddress, as: 'customerAddress' }
      ],
      order: [['created_at', 'DESC']]
    });

    const cleaned = bookings.map(b => {
      const j = b.toJSON();
      if (j.customer) {
        j.customer.name = `${j.customer.first_name} ${j.customer.last_name}`.trim();
        j.customer.phone = `${j.customer.mobile_country_code}${j.customer.mobile_no}`;
        delete j.customer.first_name; delete j.customer.last_name;
        delete j.customer.mobile_country_code; delete j.customer.mobile_no;
      }
      j.pricing = { package: j.package_price, addons: j.addons_price, total: j.total_price, discount: j.discount_price };
      j.delivery_address = j.customerAddress || j.customer_address_snapshot;
      return j;
    });

    return res.json(new APIResponse(cleaned, 'Bookings fetched'));
  }

  async getPackageBookingById(req, res) {
    const { id } = req.params;
    const booking = await database.PackageBooking.findOne({
      where: { id },
      include: [
        { model: database.Package, as: 'packageInfo', include: [{ model: database.Establishment, as: 'establishment', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] }] },
        { model: database.Customer, as: 'customer' },
        { model: database.ShippingAddress, as: 'customerAddress' }
      ]
    });

    if (!booking) return res.status(404).json(new APIResponse({}, 'Not found'));

    const j = booking.toJSON();
    if (j.customer) {
      j.customer.name = `${j.customer.first_name} ${j.customer.last_name}`.trim();
      j.customer.phone = `${j.customer.mobile_country_code}${j.customer.mobile_no}`;
      delete j.customer.first_name; delete j.customer.last_name;
      delete j.customer.mobile_country_code; delete j.customer.mobile_no;
    }

    j.pricing = { package: j.package_price, addons: j.addons_price, total: j.total_price, discount: j.discount_price };
    j.delivery_address = j.customerAddress || j.customer_address_snapshot;

    return res.json(new APIResponse(j, 'Booking fetched'));
  }

  // ======================================================
  // CANCEL PACKAGE BOOKING  (FULL UPDATED FUNCTION)
  // ======================================================
  async cancelPackageBooking(req, res) {
    try {
      const { id } = req.params;

      const booking = await database.PackageBooking.findByPk(id);
      if (!booking) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, "Booking not found", httpStatus.NOT_FOUND));
      }

      // Cancel booking
      await booking.update({
        booking_status: 2,
        reminder_sent: true,
        reminder_time: null,
      });

      // ================== REFUND BUNDLE CREDIT ==================
      // Check if this booking used a bundle
      const usageHistory = await database.BundleUsageHistory.findOne({
        where: { booking_id: id }
      });

      let refundNote = "";

      if (usageHistory) {
        const bundleItem = await database.BundlePurchaseItem.findByPk(usageHistory.purchase_item_id);
        if (bundleItem) {
          await bundleItem.increment('remaining_qty');
          refundNote = " (Bundle credit refunded)";
          console.log(`[CancelBooking] Refunding bundle credit for booking ${id}, item ${bundleItem.id}`);
        }
        // Remove history so it doesn't look like it was used for this cancelled booking
        await usageHistory.destroy();
      }
      // ==========================================================

      const customer = await database.Customer.findByPk(booking.customer_id);
      const packageInfo = await database.Package.findByPk(booking.package_id);

      const packageName = packageInfo?.name || "Package";
      const customerName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      const bookedDateFormatted = formatDate(booking.booked_date);
      const slot = booking.slot;

      // ==================== Admin Notification =====================

      const customerPhone = customer
        ? `${customer.mobile_country_code || ""}${customer.mobile_no || ""}`
        : null;

      sendAdminNotification({
        type: "package_booking_cancel",
        title: "Package Booking Cancelled",
        body: `Package booking #${booking.id} for ${packageName} has been cancelled by customer${refundNote}`,
        metadata: {
          bookingId: booking.id,

          // Package
          packageId: booking.package_id,
          packageName,

          // Date & Slot
          bookedDate: booking.booked_date,
          formattedDate: bookedDateFormatted,
          slot,

          // Pricing (important for ops)
          packagePrice: booking.package_price,
          addonsPrice: booking.addons_price,
          totalPrice: booking.total_price,

          // Collection
          homeCollection: booking.home_collection === 1,

          // Customer
          customerId: booking.customer_id,
          customerName,
          customerPhone,

          // Address snapshot
          address: booking.customer_address_snapshot || null
        }
      });

      // ==========================================================
      // NOTIFICATION
      // ==========================================================
      try {
        const notPre = await database.NotificationPreference.findOne({
          where: { customer_id: booking.customer_id },
        });

        if (notPre && notPre.package_reschedule_cancel === false) {
          console.log("⏭ Skipping notification: package_reschedule_cancel OFF");
        } else {
          await CommonService.create("Notification", {
            customer_id: booking.customer_id,
            category: "packages",
            type: "packageBookingCancel",
            resource_type: "cancelled",
            resource_id: booking.id,

            title: "Package Booking Cancelled",
            body: `${packageName} booking on ${bookedDateFormatted} at ${slot} has been cancelled`,

            metadata: {
              id: String(booking.id),
              packageId: String(booking.package_id),
              packageName,
              customerName,
              booked_date: bookedDateFormatted,
              slot,
            },

            isRead: false,
            status: "pending",
          });

          await NotificationService.sendNotification(
            booking.customer_id,
            "Package Booking Cancelled",
            `${packageName} booking has been cancelled`,
            {
              type: "packageBookingCancel",
              id: String(booking.id),
              packageId: String(booking.package_id),
              packageName,
              customerName,
              booked_date: bookedDateFormatted,
              slot,
            }
          );
        }
      } catch (err) {
        console.error("Cancel notification error:", err);
      }

      // ==========================================================
      // EMAIL
      // ==========================================================
      await sendBookingEmails({
        eventType: "cancelled",
        customerEmail: customer.email,
        customerName,
        doctorEmail: null,
        doctorName: "",
        hospitalEmail: null,
        hospitalName: "",
        date: bookedDateFormatted,
        time: slot,
      });

      return res
        .status(httpStatus.OK)
        .json(new APIResponse({}, "Booking cancelled successfully", httpStatus.OK));
    } catch (error) {
      console.error("cancelPackageBooking error:", error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, "Failed to cancel booking", httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // ======================================================
  // RESCHEDULE PACKAGE BOOKING  (FULL UPDATED FUNCTION)
  // ======================================================
  async reschedulePackageBooking(req, res) {
    const transaction = await database.sequelize.transaction();

    try {
      const { id } = req.params;
      const { booked_date, slot } = req.body;

      if (!booked_date || !slot) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, "booked_date and slot are required", httpStatus.BAD_REQUEST));
      }

      const booking = await database.PackageBooking.findOne({
        where: { id },
        include: [
          {
            model: database.Package,
            as: "packageInfo",
            include: [
              {
                model: database.Establishment,
                as: "establishment",
              },
            ],
          },
        ],
        transaction,
      });

      if (!booking) {
        await transaction.rollback();
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, "Booking not found", httpStatus.NOT_FOUND));
      }

      if ([1, 2].includes(booking.booking_status)) {
        await transaction.rollback();
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, "Cannot reschedule completed/cancelled booking", 400));
      }

      // Check if slot already taken
      const existing = await database.PackageBooking.findOne({
        where: {
          booked_date,
          slot,
          id: { [Op.ne]: id },
          booking_status: { [Op.in]: [0, 1] },
        },
        transaction,
      });

      if (existing) {
        await transaction.rollback();
        return res
          .status(httpStatus.CONFLICT)
          .json(new APIResponse({}, "Selected slot already booked", 409));
      }

      // ==========================
      // REMINDER UPDATE
      // ==========================
      let newReminder = computePackageReminderTime(booked_date, slot);
      let reminder_sent = false;

      if (newReminder && newReminder < new Date()) {
        newReminder = null;
        reminder_sent = true;
      }

      await booking.update(
        {
          booked_date,
          slot,
          reminder_time: newReminder,
          reminder_sent,
        },
        { transaction }
      );

      await transaction.commit();

      const fresh = await database.PackageBooking.findOne({
        where: { id },
        include: [
          { model: database.Package, as: "packageInfo" },
          { model: database.Customer, as: "customer" },
          { model: database.ShippingAddress, as: "customerAddress" },
        ],
      });

      const json = fresh.toJSON();

      const customerName = `${json.customer.first_name || ""} ${json.customer.last_name || ""}`.trim();
      const packageName = json.packageInfo?.name || "Package";
      const formattedDate = formatDate(booked_date);

      // ==================== Admin Notification =====================
      const customer = json.customer;

      const customerNameSafe = customer
        ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
        : null;

      const customerPhone = customer
        ? `${customer.mobile_country_code || ""}${customer.mobile_no || ""}`
        : null;

      sendAdminNotification({
        type: "package_booking_reschedule",
        title: "Package Booking Rescheduled",
        body: `Package booking #${json.id} rescheduled to ${formattedDate} at ${slot}`,
        metadata: {
          bookingId: json.id,

          // Package
          packageId: json.package_id,
          packageName: json.packageInfo?.name || "Health Package",

          // ✅ NEW Date & Slot (IMPORTANT)
          bookedDate: booked_date,
          formattedDate,
          slot,

          // Pricing
          packagePrice: json.package_price,
          addonsPrice: json.addons_price,
          totalPrice: json.total_price,

          // Collection type
          homeCollection: json.home_collection === 1,

          // Customer
          customerId: json.customer_id,
          customerName: customerNameSafe,
          customerPhone,

          // Address snapshot (ops team)
          address: json.customerAddress || json.customer_address_snapshot || null
        }
      });

      // ==========================================================
      // NOTIFICATION
      // ==========================================================
      try {
        const notPre = await database.NotificationPreference.findOne({
          where: { customer_id: json.customer.id },
        });

        if (!notPre || notPre.package_reschedule_cancel !== false) {
          await CommonService.create("Notification", {
            customer_id: json.customer.id,
            category: "packages",
            type: "packageBookingReschedule",
            resource_type: "rescheduled",
            resource_id: json.id,

            title: "Package Booking Rescheduled",
            body: `${packageName} has been rescheduled to ${formattedDate} at ${slot}`,

            metadata: {
              id: String(json.id),
              packageName,
              booked_date: formattedDate,
              slot,
              customerName,
            },

            isRead: false,
            status: "pending",
          });

          await NotificationService.sendNotification(
            json.customer.id,
            "Package Booking Rescheduled",
            `${packageName} has been rescheduled`,
            {
              type: "packageBookingReschedule",
              id: String(json.id),
              packageName,
              booked_date: formattedDate,
              slot,
            }
          );
        }
      } catch (err) {
        console.error("Reschedule notification sending failed:", err);
      }

      // ==========================================================
      // EMAIL
      // ==========================================================
      await sendBookingEmails({
        eventType: "updated",
        customerEmail: json.customer.email,
        customerName,
        doctorEmail: null,
        doctorName: "",
        hospitalEmail: null,
        hospitalName: "",
        date: formattedDate,
        time: slot,
      });

      return res
        .status(httpStatus.OK)
        .json(new APIResponse(json, "Booking rescheduled successfully", httpStatus.OK));
    } catch (error) {
      await transaction.rollback();
      console.error("reschedulePackageBooking error:", error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, "Failed to reschedule booking", 500));
    }
  }


  // async updatePackageBooking(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const updateData = req.body;

  //     const booking = await database.PackageBooking.findByPk(id);
  //     if (!booking) {
  //       return res
  //         .status(httpStatus.NOT_FOUND)
  //         .json(new APIResponse({}, 'Booking not found', httpStatus.NOT_FOUND));
  //     }

  //     // Update price if package_id changed
  //     if (updateData.package_id && updateData.package_id !== booking.package_id) {
  //       const newPkg = await database.Package.findByPk(updateData.package_id, {
  //         attributes: ['id', 'selling_price']
  //       });
  //       if (!newPkg) {
  //         return res
  //           .status(httpStatus.BAD_REQUEST)
  //           .json(new APIResponse({}, 'Invalid package_id', httpStatus.BAD_REQUEST));
  //       }
  //       updateData.booking_price = updateData.booking_price ?? newPkg.selling_price;
  //     }

  //     // Map booking_status
  //     if (updateData.booking_status !== undefined) {
  //       const statusMap = { pending: 0, confirmed: 1, cancelled: 2 };
  //       const statusValue = statusMap[updateData.booking_status] ?? parseInt(updateData.booking_status);
  //       if (![0, 1, 2].includes(statusValue)) {
  //         return res
  //           .status(httpStatus.BAD_REQUEST)
  //           .json(new APIResponse({}, 'Invalid booking_status', httpStatus.BAD_REQUEST));
  //       }
  //       updateData.booking_status = statusValue;
  //     }

  //     await booking.update(updateData);

  //     // Fetch updated booking with nested establishment
  //     const updatedBooking = await database.PackageBooking.findOne({
  //       where: { id },
  //       include: [
  //         {
  //           model: database.Package,
  //           as: 'packageInfo',
  //           attributes: [
  //             'id', 'name', 'sub_title', 'selling_price', 'image'
  //           ],
  //           include: [{
  //             model: database.Establishment,
  //             as: 'establishment',
  //             attributes: ['id', 'name', 'address', 'latitude', 'longitude']
  //           }]
  //         },
  //         {
  //           model: database.Customer,
  //           as: 'customer',
  //           attributes: ['id', 'first_name', 'last_name', 'email', 'mobile_country_code', 'mobile_no']
  //         }
  //       ]
  //     });

  //     // Clean response: add virtual name & phone
  //     const json = updatedBooking.toJSON();
  //     if (json.customer) {
  //       json.customer.name = `${json.customer.first_name || ''} ${json.customer.last_name || ''}`.trim();
  //       json.customer.phone = `${json.customer.mobile_country_code || ''}${json.customer.mobile_no || ''}`.trim();
  //       delete json.customer.first_name;
  //       delete json.customer.last_name;
  //       delete json.customer.mobile_country_code;
  //       delete json.customer.mobile_no;
  //     }

  //     return res
  //       .status(httpStatus.OK)
  //       .json(new APIResponse(json, 'Booking updated successfully', httpStatus.OK));

  //   } catch (error) {
  //     console.error('updatePackageBooking error:', error);
  //     return res
  //       .status(httpStatus.INTERNAL_SERVER_ERROR)
  //       .json(new APIResponse({}, 'Failed to update booking', httpStatus.INTERNAL_SERVER_ERROR));
  //   }
  // }


  async listPackageCategories(req, res) {
    try {
      const categories = await database.PackageCategory.findAll({
        where: { deleted_at: null },
        attributes: {
          exclude: ['created_at', 'updated_at', 'deleted_at']
        },
        order: [['name', 'ASC']]
      });

      const processed = categories.map(cat => {
        const data = cat.toJSON();
        // Process icon if needed (similar to Package image)
        return data;
      });

      return res.status(httpStatus.OK).json(new APIResponse({
        data: processed
      }, 'Package categories listed successfully', httpStatus.OK));

    } catch (error) {
      console.error('listPackageCategories error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to list package categories', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  async getPackagesByCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const where = { visible: true };

      const { count, rows } = await database.Package.findAndCountAll({
        where,
        attributes: [
          'id', 'name', 'sub_title', 'selling_price', 'strike_price',
          'discount_text', 'image', 'service_duration_minutes', 'sla', 'sla_unit', 'demographics', 'type',
          'result_time', 'recommended', 'top_packages', 'tag', 'instructionBeforeTest'
        ],
        include: [
          {
            model: database.PackageCategory,
            as: 'category',
            where: { id: categoryId },
            attributes: ['id', 'name', 'description', 'icon'],
            required: true
          },
          {
            model: database.Establishment,
            as: 'establishment',
            attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'is_24_by_7_working']
          },
          {
            model: database.Biomarker,
            as: 'biomarkers',
            attributes: [],
            through: { attributes: [] }
          }
        ]
      });

      if (count === 0) {
        return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, 'No packages found in this category', httpStatus.NOT_FOUND));
      }

      // FINAL: ONE PASS → HOURS + BADGE (similar to listPackages)
      const packages = await Promise.all(
        rows.map(async (pkg) => {
          const data = pkg.toJSON();

          // 1. Ensure establishment exists
          if (!data.establishment) {
            data.establishment = { workingHoursDetails: [] };
          }

          // 2. Load working hours
          if (data.establishment.id) {
            const hours = await database.EstablishmentWorkingHour.findAll({
              where: { establishment_id: data.establishment.id },
              attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'],
              order: [['day_of_week', 'ASC']],
              raw: true
            });
            data.establishment.workingHoursDetails = hours.map(h => ({
              day_of_week: +h.day_of_week,
              start_time: h.start_time.toString().slice(0, 5),
              end_time: h.end_time.toString().slice(0, 5),
              is_day_off: h.is_day_off === '1' || h.is_day_off === 1
            }));
          } else {
            data.establishment.workingHoursDetails = [];
          }

          // 3. Bookings badge
          const completed = await database.PackageBooking.count({
            where: { package_id: data.id, booking_status: 1 }
          });
          const badge = (Math.floor(completed / 10) * 10) + '+';

          return {
            ...data,
            total_biomarkers: data.biomarkers?.length || 0,
            bookings_badge: badge,
            reviews: 16,
            rating: 4.5
          };
        })
      );

      return res.status(httpStatus.OK).json(new APIResponse({
        data: packages,
        count: { total: count }
      }, 'Packages in category fetched successfully', httpStatus.OK));

    } catch (error) {
      console.error('getPackagesByCategory error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Failed to fetch packages by category', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
  // ================== LIST PACKAGE BUNDLES ==================
  async listPackageBundles(req, res) {
    try {
      const { search, establishment_id } = req.query;

      const where = { visible: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { sub_title: { [Op.like]: `%${search}%` } }
        ];
      }

      if (establishment_id) {
        where.establishment_id = establishment_id;
      }

      const bundles = await database.PackageBundle.findAll({
        where,
        attributes: [
          'id',
          'name',
          'sub_title',
          'image',
          'base_price',
          'strike_price',
          'selling_price',
          'validity_days',
          'label'
        ],
        include: [
          {
            model: database.Package,
            as: 'packages',
            attributes: ['id'],
            through: { attributes: ['qty'] }
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const response = bundles.map(b => {
        const j = b.toJSON();
        return {
          ...j,
          total_packages: j.packages.length
        };
      });

      return res.status(200).json(
        new APIResponse(
          { data: response },
          'Package bundles listed successfully',
          200
        )
      );

    } catch (error) {
      console.error('listPackageBundles error:', error);
      return res.status(500).json(
        new APIResponse({}, 'Failed to list package bundles', 500)
      );
    }
  }


  // ================== BUNDLE DETAILS ==================
  async getPackageBundleDetails(req, res) {
    try {
      const { id } = req.params;

      const bundle = await database.PackageBundle.findOne({
        where: { id, visible: true },
        attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
        include: [
          {
            model: database.Package,
            as: 'packages',
            attributes: [
              'id',
              'name',
              'sub_title',
              'image',
              'selling_price'
            ],
            through: {
              attributes: ['qty']
            }
          },
          {
            model: database.Establishment,
            as: 'establishment',
            attributes: ['id', 'name', 'address', 'latitude', 'longitude']
          },
          {
            model: database.PackageCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!bundle) {
        return res.status(404).json(
          new APIResponse({}, 'Package bundle not found', 404)
        );
      }

      const data = bundle.toJSON();

      // ================= PRICE BREAKDOWN =================
      let calculatedTotal = 0;

      const packages = data.packages.map(p => {
        const qty = p.PackageBundleItem.qty || 1;
        const price = Number(p.selling_price) || 0;
        calculatedTotal += price * qty;

        return {
          id: p.id,
          name: p.name,
          sub_title: p.sub_title,
          image: p.image,
          unit_price: price,
          qty,
          total_price: price * qty
        };
      });

      data.packages = packages;

      data.pricing = {
        bundle_price: Number(data.selling_price),
        calculated_packages_price: calculatedTotal,
        savings:
          calculatedTotal > data.selling_price
            ? calculatedTotal - data.selling_price
            : 0
      };

      return res.status(200).json(
        new APIResponse(data, 'Package bundle details fetched', 200)
      );

    } catch (error) {
      console.error('getPackageBundleDetails error:', error);
      return res.status(500).json(
        new APIResponse({}, 'Failed to fetch bundle details', 500)
      );
    }
  }

  // ================== HELPER FOR B2B VERIFICATION ==================
  async validateB2BCoupon(coupon_code, user, transaction) {
    // 1. Find Subscription
    const subscription = await database.B2BBundleSubscription.findOne({
      where: { coupon_code },
      transaction
    });

    if (!subscription) {
      return { valid: false, message: "Invalid coupon code" };
    }

    // Check Expiry
    if (subscription.valid_until && new Date() > new Date(subscription.valid_until)) {
      return { valid: false, message: "Coupon code has expired" };
    }

    // 2. Check Whitelist
    const { mobile_country_code, mobile_no } = user;

    // Normalize country code (ensure '+' prefix)
    let userCC = String(mobile_country_code || "").trim();
    if (userCC && !userCC.startsWith('+')) userCC = '+' + userCC;

    const userPhone = String(mobile_no || "").trim();

    const employeeRecord = await database.B2BEmployeeCoupon.findOne({
      where: {
        subscription_id: subscription.id,
        employee_phone: userPhone,
        country_code: userCC,
        status: 'available'
      },
      transaction
    });

    if (!employeeRecord) {
      return { valid: false, message: `Invalid coupon code or unauthorized user` };
    }

    return {
      valid: true,
      subscription,
      employeeRecord,
      bundle_id: subscription.bundle_id
    };
  }

  // ================== PUBLIC VERIFICATION ENDPOINT ==================
  async verifyB2BCoupon(req, res) {
    try {
      const { coupon_code, mobile_country_code, mobile_no } = req.body;

      // Determine user details: From token (req.user) OR body (if pre-login check)
      let user = req.user;
      if (!user && mobile_no) {
        user = { mobile_country_code, mobile_no };
      }

      if (!user) {
        return res.status(401).json(new APIResponse({}, "User details required for verification", 401));
      }

      const check = await this.validateB2BCoupon(coupon_code, user);

      if (!check.valid) {
        return res.status(200).json(new APIResponse({ valid: false }, check.message, 200));
      }

      // Fetch bundle name for UI confirmation
      const bundle = await database.PackageBundle.findByPk(check.bundle_id, { attributes: ['name'] });

      return res.status(200).json(new APIResponse({
        valid: true,
        bundle_name: bundle ? bundle.name : "Unknown Bundle",
        company_name: check.subscription.company_name
      }, "Coupon is valid", 200));

    } catch (error) {
      console.error("verifyB2BCoupon error:", error);
      return res.status(500).json(new APIResponse({}, "Verification failed", 500));
    }
  }

  // ================== PURCHASE BUNDLE ==================
  async purchaseBundle(req, res) {
    let t;
    try {
      t = await database.sequelize.transaction();
      const { bundle_id, coupon_code } = req.body;
      const customer_id = req.user.id;
      const customerPhone = req.user.fullMobile; // Assumes middleware populates this, check user.js if needed. 
      // Note: If req.user doesn't have fullMobile, we might need to fetch it or construct it.
      // Usually req.user has what's in the token. 
      // Let's assume req.user is populated from DB or has mobile_no.
      // If req.user is from token, it might not have everything.
      // Safer to use the customer_id to fetch phone if needed, but let's try to trust req.user or fetch.

      // Let's rely on what we have or fetch user to be sure.
      const user = await database.Customer.findByPk(customer_id, { transaction: t });
      const userFullMobile = user ? (user.mobile_country_code + user.mobile_no) : "";

      let isB2B = false;
      let subscription = null;
      let employeeRecord = null;
      let targetBundleId = bundle_id;

      // ================== B2B COUPON CHECK (SHARED COUPON) ==================
      if (coupon_code) {
        const check = await this.validateB2BCoupon(coupon_code, {
          mobile_country_code: user.mobile_country_code,
          mobile_no: user.mobile_no
        }, t);

        if (!check.valid) {
          await t.rollback();
          return res.status(400).json(new APIResponse({}, check.message));
        }

        // B2B dictates exact bundle (security)
        targetBundleId = check.bundle_id;
        employeeRecord = check.employeeRecord;
        isB2B = true;
      }

      // Fetch bundle with packages and qty
      const bundle = await database.PackageBundle.findByPk(targetBundleId, {
        include: [{
          model: database.Package,
          as: 'packages',
          through: { attributes: ['qty'] }
        }],
        transaction: t
      });

      if (!bundle) {
        await t.rollback();
        return res.status(404).json(new APIResponse({}, 'Bundle not found'));
      }

      // Calculate expiry
      const purchaseDate = new Date();
      const expirationDate = new Date(purchaseDate);
      expirationDate.setDate(expirationDate.getDate() + (bundle.validity_days || 180));

      // Purchase Status & Payment
      let status = 'pending';
      let payment_id = null;
      let total_price = Number(bundle.selling_price);

      if (isB2B) {
        // status = 'active'; // REPLACED by generic price check below
        payment_id = 'B2B_COUPON:' + coupon_code;
        total_price = 0; // Free for employee
      }

      // Auto-activate if free
      if (total_price === 0) {
        status = 'active';
      }

      const purchase = await database.BundlePurchase.create({
        customer_id,
        bundle_id: bundle.id,
        purchase_date: purchaseDate,
        expiration_date: expirationDate,
        total_price,
        payment_id,
        status
      }, { transaction: t });

      // Create items with qty
      for (const pkg of bundle.packages) {
        const qty = pkg.PackageBundleItem.qty || 1;
        await database.BundlePurchaseItem.create({
          purchase_id: purchase.id,
          package_id: pkg.id,
          initial_qty: qty, // Default to 1 if not set
          remaining_qty: qty
        }, { transaction: t });
      }

      // Mark Employee Record as Claimed
      if (isB2B && employeeRecord) {
        await employeeRecord.update({
          status: 'claimed',
          claimed_by_customer_id: customer_id,
          claimed_at: new Date()
        }, { transaction: t });
      }

      await t.commit();

      const msg = isB2B
        ? "Bundle claimed successfully!"
        : "Bundle purchase initiated. Please complete payment.";

      return res.status(200).json(new APIResponse({
        purchase_id: purchase.id,
        bundle_name: bundle.name,
        total_price,
        expiration_date: formatDate(expirationDate),
        status
      }, msg, 201));

    } catch (error) {
      if (t) await t.rollback();
      console.error('purchaseBundle error:', error);
      return res.status(500).json(
        new APIResponse({}, 'Failed to purchase bundle', 500)
      );
    }
  }

  // ================== MY BUNDLES (PURCHASE LIST + REMAINING + HISTORY) ==================
  async getMyBundles(req, res) {
    try {
      const customer_id = req.user.id;

      const purchases = await database.BundlePurchase.findAll({
        where: { customer_id },
        include: [
          {
            model: database.PackageBundle,
            as: 'bundle',
            attributes: ['id', 'name', 'image', 'selling_price', 'validity_days'],
            include: [
              {
                model: database.Package,
                as: 'packages',
                attributes: ['id', 'name', 'image'],
                through: { attributes: ['qty'] }
              }
            ]
          },
          {
            model: database.BundlePurchaseItem,
            as: 'items',
            attributes: ['id', 'package_id', 'remaining_qty', 'initial_qty'],
            include: [
              {
                model: database.BundleUsageHistory,
                as: 'usageHistory',
                attributes: ['usage_date', 'booking_id'],
                order: [['usage_date', 'DESC']]
              }
            ]
          }
        ],
        order: [['purchase_date', 'DESC']]
      });

      const formatted = purchases.map(p => {
        const bundlePackages = p.bundle?.packages || [];
        const purchaseItemsMap = {};
        p.items.forEach(item => {
          purchaseItemsMap[item.package_id] = item;
        });

        const packages = bundlePackages.map(pkg => {
          const purchaseItem = purchaseItemsMap[pkg.id];

          const total = purchaseItem ? purchaseItem.initial_qty : (pkg.PackageBundleItem?.qty || 1);
          const remaining = purchaseItem ? purchaseItem.remaining_qty : total;
          const used = total - remaining;

          return {
            package_id: pkg.id,
            bundle_purchase_item_id: purchaseItem ? purchaseItem.id : null,
            package_name: pkg.name,
            package_image: pkg.image,
            initial_qty: total,
            remaining_qty: remaining,
            used_qty: used
          };
        });

        // "Flat" list of all available slots for quick booking display if needed
        const remainingUses = [];
        packages.forEach(pkg => {
          for (let i = 0; i < pkg.remaining_qty; i++) {
            remainingUses.push({
              bundle_purchase_item_id: pkg.bundle_purchase_item_id,
              package_id: pkg.package_id,
              package_name: pkg.package_name,
              package_image: pkg.package_image
            });
          }
        });

        // Usage history (all past uses)
        const history = p.items.flatMap(item => {
          const pkg = bundlePackages.find(bp => bp.id === item.package_id);
          return (item.usageHistory || []).map(h => ({
            bundle_purchase_item_id: item.id,
            package_id: item.package_id,
            package_name: pkg ? pkg.name : "N/A",
            package_image: pkg ? pkg.image : null,
            booking_id: h.booking_id,
            usage_date: formatDate(h.usage_date),
            qty: 1
          }));
        }).sort((a, b) => new Date(b.usage_date) - new Date(a.usage_date));

        return {
          purchase_id: p.id,
          bundle_id: p.bundle.id,
          bundle_name: p.bundle.name,
          bundle_image: p.bundle.image,
          purchase_date: formatDate(p.purchase_date),
          expiration_date: formatDate(p.expiration_date),
          total_price: p.total_price,
          status: p.status,
          packages: packages,
          remaining_uses: remainingUses,
          usage_history: history
        };
      });

      return res.status(200).json(new APIResponse(formatted, "My bundles fetched successfully", 200));

    } catch (error) {
      console.error('getMyBundles error:', error);
      return res.status(500).json(new APIResponse({}, "Failed to fetch my bundles", 500));
    }
  }

}

export default new ServiceController();


export async function processPackageBookingReminders() {
  try {
    const now = new Date();

    console.log("[PackageReminders] Running", now.toISOString());

    const bookings = await database.PackageBooking.findAll({
      where: {
        booking_status: 0,          // Pending
        reminder_sent: false,
        reminder_time: { [Op.lte]: now }
      }
    });

    if (!bookings.length) {
      console.log("[PackageReminders] No reminders to send");
      return;
    }

    for (const booking of bookings) {
      try {
        const plain = booking.toJSON();

        // Notification preference
        const pref = await database.NotificationPreference.findOne({
          where: { customer_id: plain.customer_id }
        });

        if (pref && pref.package_reminders === false) {
          console.log(`Skipping reminder for user ${plain.customer_id}`);
          await booking.update({ reminder_sent: true });
          continue;
        }

        // Avoid duplicate reminders
        const existing = await database.Notification.findOne({
          where: {
            customer_id: plain.customer_id,
            resource_id: plain.id,
            type: "packageBookingReminder"
          }
        });

        if (existing) {
          console.log(`Reminder exists for ${plain.id}, skipping`);
          await booking.update({ reminder_sent: true });
          continue;
        }

        const packageInfo = await database.Package.findByPk(plain.package_id);

        const title = "Upcoming Package Booking";
        const body = `Reminder: Your package booking for ${packageInfo?.name || "Package"} is at ${plain.slot}`;

        await database.Notification.create({
          customer_id: plain.customer_id,
          category: "packages",
          type: "packageBookingReminder",
          resource_type: "reminder",
          resource_id: plain.id,

          title,
          body,

          metadata: {
            id: String(plain.id),
            packageName: packageInfo?.name,
            booked_date: plain.booked_date,
            slot: plain.slot
          },

          isRead: false,
          status: "pending"
        });

        await NotificationService.sendNotification(
          plain.customer_id,
          title,
          body,
          {
            type: "packageBookingReminder",
            id: String(plain.id),
            packageName: packageInfo?.name,
            booked_date: plain.booked_date,
            slot: plain.slot
          }
        );

        await booking.update({ reminder_sent: true });

      } catch (err) {
        console.error("[PackageReminders] Error:", err);
      }
    }
  } catch (err) {
    console.error("[PackageReminders] FAILED:", err);
  }
}
