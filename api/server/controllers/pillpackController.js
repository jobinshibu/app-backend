import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import database from '../models/index.js';
import { extractPrescriptionData } from '../services/ocrService.js';

class PillpackController {

  constructor() {
    // ===============================
    // PRESCRIPTIONS
    // ===============================
    this.uploadPrescription = this.uploadPrescription.bind(this);
    this.getMyPrescriptions = this.getMyPrescriptions.bind(this);
    this.getPrescriptionDetails = this.getPrescriptionDetails.bind(this);

    // ===============================
    // ORDER (SUBSCRIPTION)
    // ===============================
    this.placeOrder = this.placeOrder.bind(this);
    this.getMyOrders = this.getMyOrders.bind(this);
    this.pauseSubscription = this.pauseSubscription.bind(this);
    this.resumeSubscription = this.resumeSubscription.bind(this);
    this.cancelSubscription = this.cancelSubscription.bind(this);

    // ===============================
    // ADHERENCE
    // ===============================
    this.getAdherenceCalendar = this.getAdherenceCalendar.bind(this);
    this.markDoseTaken = this.markDoseTaken.bind(this);
    this.getAdherenceSummary = this.getAdherenceSummary.bind(this);

    // ===============================
    // CAREGIVERS
    // ===============================
    this.addCaregiver = this.addCaregiver.bind(this);
    this.getMyCaregivers = this.getMyCaregivers.bind(this);
  }

  /* ======================================================
     1. UPLOAD PRESCRIPTION
     ====================================================== */
  async uploadPrescription(req, res) {
    try {
      const customer_id = req.user.id;

      if (!req.file) {
        return res.status(400).json(
          new APIResponse({}, 'Prescription file required', 400)
        );
      }

      let ocrData = null;
      try {
        ocrData = await extractPrescriptionData(req.file.path);
      } catch (err) {
        console.error('OCR failed:', err);
      }

      const prescription = await database.PillpackPrescription.create({
        customer_id,
        prescription_file: req.file.filename,
        upload_method: req.body.upload_method || 'camera',
        doctor_name: req.body.doctor_name || ocrData?.doctor_name,
        prescription_date: req.body.prescription_date || ocrData?.prescription_date,
        status: 'pending',
        ocr_data: ocrData ? JSON.stringify(ocrData) : null
      });

      // 🔹 Save extracted medicines
      if (ocrData?.medicines?.length) {
        for (const med of ocrData.medicines) {
          await database.PillpackMedicine.create({
            prescription_id: prescription.id,
            medicine_name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            timing: JSON.stringify(med.timing || [])
          });
        }
      }

      return res.status(200).json(
        new APIResponse(
          { prescription_id: prescription.id },
          'Prescription uploaded',
          200
        )
      );
    } catch (error) {
      console.error('uploadPrescription error:', error);
      return res.status(500).json(
        new APIResponse({}, 'Upload failed', 500)
      );
    }
  }

  /* ======================================================
     2. GET MY PRESCRIPTIONS
     ====================================================== */
  async getMyPrescriptions(req, res) {
    const customer_id = req.user.id;

    const prescriptions = await database.PillpackPrescription.findAll({
      where: { customer_id },
      include: [{ model: database.PillpackMedicine, as: 'medicines' }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(
      new APIResponse(prescriptions, 'Prescriptions fetched', 200)
    );
  }

  /* ======================================================
     3. GET PRESCRIPTION DETAILS
     ====================================================== */
  async getPrescriptionDetails(req, res) {
    const { prescriptionId } = req.params;
    const customer_id = req.user.id;

    const prescription = await database.PillpackPrescription.findOne({
      where: { id: prescriptionId, customer_id },
      include: [
        { model: database.PillpackMedicine, as: 'medicines' },
        { model: database.PillpackSubscription, as: 'subscription', required: false }
      ]
    });

    if (!prescription) {
      return res.status(404).json(
        new APIResponse({}, 'Prescription not found', 404)
      );
    }

    return res.status(200).json(
      new APIResponse(prescription, 'Prescription fetched', 200)
    );
  }

  /* ======================================================
     4. PLACE ORDER (NO DELIVERY)
     ====================================================== */
  async placeOrder(req, res) {
    try {
      const customer_id = req.user.id;
      const { prescription_id, cycle_type, pack_type, start_date } = req.body;

      if (!prescription_id || !start_date) {
        return res.status(400).json(
          new APIResponse({}, 'prescription_id & start_date required', 400)
        );
      }

      // 🔹 Prescription must be verified
      const prescription = await database.PillpackPrescription.findOne({
        where: { id: prescription_id, customer_id, status: 'verified' }
      });

      if (!prescription) {
        return res.status(400).json(
          new APIResponse({}, 'Prescription not verified', 400)
        );
      }

      // 🔹 Calculate refill date
      const cycleMap = { '7_day': 7, '15_day': 15, '30_day': 30, '90_day': 90 };
      const days = cycleMap[cycle_type || '30_day'];

      const start = new Date(start_date);
      const nextRefill = new Date(start);
      nextRefill.setDate(start.getDate() + days);

      // 🔹 Create ORDER (subscription)
      const order = await database.PillpackSubscription.create({
        customer_id,
        prescription_id,
        cycle_type: cycle_type || '30_day',
        pack_type: pack_type || 'monthly',
        start_date,
        next_refill_date: nextRefill,
        status: 'active'
      });

      // 🔹 Create adherence calendar
      await this.createAdherenceRecords(order.id, start_date, days);

      return res.status(201).json(
        new APIResponse(order, 'Order placed successfully', 201)
      );

    } catch (error) {
      console.error('placeOrder error:', error);
      return res.status(500).json(
        new APIResponse({}, 'Order failed', 500)
      );
    }
  }

  /* ======================================================
     5. GET MY ORDERS
     ====================================================== */
  async getMyOrders(req, res) {
    const customer_id = req.user.id;

    const orders = await database.PillpackSubscription.findAll({
      where: { customer_id },
      include: [{ model: database.PillpackPrescription, as: 'prescription' }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(
      new APIResponse(orders, 'Orders fetched', 200)
    );
  }

  /* ======================================================
     6. PAUSE / RESUME / CANCEL ORDER
     ====================================================== */
  async pauseSubscription(req, res) {
    const { orderId } = req.params;
    const customer_id = req.user.id;

    const order = await database.PillpackSubscription.findOne({
      where: { id: orderId, customer_id }
    });

    if (!order) {
      return res.status(404).json(new APIResponse({}, 'Order not found', 404));
    }

    await order.update({ status: 'paused', paused_from: new Date() });
    return res.status(200).json(new APIResponse({}, 'Order paused', 200));
  }

  async resumeSubscription(req, res) {
    const { orderId } = req.params;
    const customer_id = req.user.id;

    const order = await database.PillpackSubscription.findOne({
      where: { id: orderId, customer_id }
    });

    if (!order) {
      return res.status(404).json(new APIResponse({}, 'Order not found', 404));
    }

    await order.update({ status: 'active' });
    return res.status(200).json(new APIResponse({}, 'Order resumed', 200));
  }

  async cancelSubscription(req, res) {
    const { orderId } = req.params;
    const customer_id = req.user.id;

    const order = await database.PillpackSubscription.findOne({
      where: { id: orderId, customer_id }
    });

    if (!order) {
      return res.status(404).json(new APIResponse({}, 'Order not found', 404));
    }

    await order.update({ status: 'cancelled' });
    return res.status(200).json(new APIResponse({}, 'Order cancelled', 200));
  }

  /* ======================================================
     7. ADHERENCE
     ====================================================== */
  async getAdherenceCalendar(req, res) {
    const customer_id = req.user.id;

    const records = await database.PillpackAdherence.findAll({
      where: { customer_id },
      order: [['dose_date', 'ASC']]
    });

    return res.status(200).json(
      new APIResponse(records, 'Adherence fetched', 200)
    );
  }

  async markDoseTaken(req, res) {
    const { adherenceId } = req.params;
    const customer_id = req.user.id;

    const record = await database.PillpackAdherence.findOne({
      where: { id: adherenceId, customer_id }
    });

    if (!record) {
      return res.status(404).json(
        new APIResponse({}, 'Record not found', 404)
      );
    }

    await record.update({
      status: 'taken',
      taken_at: new Date()
    });

    return res.status(200).json(
      new APIResponse({}, 'Dose marked as taken', 200)
    );
  }
  

  async getAdherenceSummary(req, res) {
    const customer_id = req.user.id;

    const records = await database.PillpackAdherence.findAll({
      where: { customer_id }
    });

    const summary = { taken: 0, missed: 0, skipped: 0, pending: 0 };

    for (const r of records) {
      summary[r.status]++;
    }

    return res.status(200).json(
      new APIResponse(summary, 'Adherence summary fetched', 200)
    );
  }

  /* ======================================================
     8. CAREGIVERS
     ====================================================== */
  async addCaregiver(req, res) {
    const customer_id = req.user.id;

    const caregiver = await database.Customer.findOne({
      where: { email: req.body.caregiver_email }
    });

    if (!caregiver) {
      return res.status(404).json(
        new APIResponse({}, 'Caregiver not found', 404)
      );
    }

    await database.PillpackCaregiver.create({
      customer_id,
      caregiver_id: caregiver.id,
      permissions: JSON.stringify(['view_adherence']),
      status: 'pending'
    });

    return res.status(200).json(
      new APIResponse({}, 'Caregiver added', 200)
    );
  }

  async getMyCaregivers(req, res) {
    const customer_id = req.user.id;

    const caregivers = await database.PillpackCaregiver.findAll({
      where: { customer_id },
      include: [{ model: database.Customer, as: 'caregiver' }]
    });

    return res.status(200).json(
      new APIResponse(caregivers, 'Caregivers fetched', 200)
    );
  }

  /* ======================================================
     HELPER: CREATE ADHERENCE
     ====================================================== */
  async createAdherenceRecords(subscriptionId, startDate, cycleDays) {
    const sub = await database.PillpackSubscription.findByPk(subscriptionId, {
      include: [{
        model: database.PillpackPrescription,
        as: 'prescription',
        include: [{ model: database.PillpackMedicine, as: 'medicines' }]
      }]
    });

    if (!sub || !sub.prescription) return;

    const start = new Date(startDate);

    for (let d = 0; d < cycleDays; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);

      for (const med of sub.prescription.medicines) {
        const timings = JSON.parse(med.timing || '[]');

        for (const slot of timings) {
          await database.PillpackAdherence.create({
            customer_id: sub.customer_id,
            subscription_id: subscriptionId,
            dose_date: date,
            time_slot: slot,
            scheduled_time: '08:00:00',
            status: 'pending'
          });
        }
      }
    }
  }
}

export default new PillpackController();
