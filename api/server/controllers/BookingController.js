import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import CommonService from '../services/common.js';
import { Op } from 'sequelize';
import CryptoJS from 'crypto-js';
import db from '../models/index.js';
import NotificationService from '../services/notificationService.js';
import { sendAdminNotification } from '../utils/adminNotifier.js';

// ⭐ IMPORT EMAIL SERVICE
import { sendBookingEmails } from "../services/EmailService.js";

function formatDate(d) {
  if (!d) return "";
  const dateObj = new Date(d);

  const options = { day: "2-digit", month: "short", year: "numeric" };
  return dateObj.toLocaleDateString("en-GB", options); 
  // Example: "08 Dec 2025"
}


function computeReminderTime(booking_date, time_slot) {
  if (!booking_date || !time_slot) return null;

  try {
    // Example slot: "01:00 PM to 02:00 PM"
    const slotStart = String(time_slot).split(" to ")[0].trim();  
    // → "01:00 PM"

    const [time, modifier] = slotStart.split(" "); // "01:00", "PM"
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const appt = new Date(booking_date); 
    appt.setHours(hours, minutes, 0, 0);

    return new Date(appt.getTime() - 60 * 60 * 1000); // 1 hour before
  } catch (e) {
    console.error("computeReminderTime error:", e);
    return null;
  }
}


class BookingController {

  async createBooking(req, res) {
    try {
      const {
        doctor_id,
        customer_id,
        patient_name,
        patient_number,
        age,
        gender,
        booking_date,
        time_slot,
        hospital_id,
        // insurance_id
      } = req.body;

      if (!customer_id || !booking_date || !time_slot) {
        return res.status(400).json(new APIResponse({}, 'customer_id, booking_date, and time_slot are required', 400));
      }

      // Validate customer
      const customer = await CommonService.getSingleRecordByCondition('Customer', { id: customer_id, deleted_at: null });
      if (!customer) return res.status(404).json(new APIResponse({}, 'Customer not found', 404));

      const encryptField = (value) => value ? CryptoJS.AES.encrypt(String(value), process.env.SECRET_KEY).toString() : null;
      const decryptField = (value) => value ? CryptoJS.AES.decrypt(value, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8) || null : null;

      // === DOCTOR DETAILS ===
      let doctorDetails = {};
      let doctor = null;
      if (doctor_id) {
        doctor = await CommonService.getSingleRecordByCondition('Profession', { id: doctor_id, deleted_at: null }, 
          [
            { 
              model: db.profession_working_hours, 
              as: 'working_hours', 
              attributes: ['day_of_week', 'start_time', 'end_time', 'is_day_off'] 
            },
            {
              model: db.ProfessionSpeciality,
              as: 'specialitiesList',
              attributes: ["id"],
              include: [
                {
                  model: db.Specialities,
                  as: 'specialityInfo',
                  attributes: ['name']
                }
              ]
            }
          ]
        );

        if (!doctor) return res.status(404).json(new APIResponse({}, 'Doctor not found', 404));
 // Generate comma-separated specialties (exactly like in search API)
        // let specialtyString = 'General Practitioner';
        // if (doctor.specialitiesList && doctor.specialitiesList.length > 0) {
        //   specialtyString = doctor.specialitiesList
        //     .map(s => s.specialityInfo?.name)
        //     .filter(Boolean)
        //     .join(', ');
        // }
        doctorDetails = {
          name: encryptField(`${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()),
          specialty: doctor.designation || '',
          about: doctor.about || '',
          hospital: '',
          image: doctor.photo || null,
          latitude: doctor.latitude || null,
          longitude: doctor.longitude || null,
          working_hours: doctor.working_hours || []
        };
      }

      // === HOSPITAL DETAILS ===
      let hospitalDetails = {};
      let hospital = null;
      if (hospital_id) {
        hospital = await CommonService.getSingleRecordByCondition('Establishment', { id: hospital_id, deleted_at: null });
        if (!hospital) return res.status(404).json(new APIResponse({}, 'Hospital not found', 404));

        hospitalDetails = {
          name: encryptField(hospital.name || ''),
          address: encryptField(hospital.address || ''),
          phone: encryptField(hospital.phone || ''),
          latitude: hospital.latitude || null,
          longitude: hospital.longitude || null
        };
      }

      // Compute reminder time
      let reminder_time = computeReminderTime(booking_date, time_slot);

      // Prevent reminders from triggering instantly
      let reminder_sent = false;
      const now = new Date();

      if (reminder_time && reminder_time < now) {
        console.log("⏭ Reminder time already passed → marking reminder_sent = true");
        reminder_sent = true;
        reminder_time = null; // or keep original, but null is cleaner
      }

      // === CREATE BOOKING ===
      const bookingData = {
        doctor_id: doctor_id || null,
        customer_id,
        patient_name: encryptField(patient_name),
        patient_number: encryptField(patient_number),
        patient_age: age ? encryptField(age) : null,
        patient_gender: encryptField(gender),
        booking_date,
        time_slot,
        hospital_id: hospital_id || null,
        // insurance_id: insurance_id ? encryptField(insurance_id) : null,
        doctor_details: Object.keys(doctorDetails).length > 0 ? doctorDetails : null,
        hospital_details: Object.keys(hospitalDetails).length > 0 ? hospitalDetails : null,
        status: '0',
        reminder_time,
        reminder_sent
      };

      const booking = await CommonService.create('Booking', bookingData);
      const plain = booking.toJSON ? booking.toJSON() : booking;

      // === DECRYPT RESPONSE ===
      const decrypt = (field) => field ? decryptField(field) : null;
      plain.patient_name = decrypt(plain.patient_name);
      plain.patient_number = decrypt(plain.patient_number);
      plain.patient_age = plain.patient_age ? Number(decrypt(plain.patient_age)) : null;
      plain.patient_gender = decrypt(plain.patient_gender);
      // plain.insurance_id = plain.insurance_id ? Number(decrypt(plain.insurance_id)) : null;

      if (plain.doctor_details?.name) plain.doctor_details.name = decrypt(plain.doctor_details.name);
      if (plain.hospital_details) {
        plain.hospital_details.name = decrypt(plain.hospital_details.name);
        plain.hospital_details.address = decrypt(plain.hospital_details.address);
        plain.hospital_details.phone = decrypt(plain.hospital_details.phone);
      }

      //==================== Admin Notification =====================
      sendAdminNotification({
        type: "doctor_booking",
        title: "New Doctor Booking",
        body: `Booking #${booking.id} created for ${plain.hospital_details?.name}`,
        metadata: {
          bookingId: booking.id,

          date: booking.booking_date,
          formattedDate: formatDate(booking.booking_date),

          time: booking.time_slot,

          customerId: booking.customer_id,

          doctorId: booking.doctor_id || null,
          doctorName: plain.doctor_details?.name || null,

          hospitalId: booking.hospital_id || null,
          hospitalName: plain.hospital_details?.name || null,

          patientName: plain.patient_name || null,
          patientPhone: plain.patient_number || null
        } 
      });

     // ===== CREATE NOTIFICATION (APPOINTMENT CONFIRMED) =====

      try {
        const notPre = await db.NotificationPreference.findOne({
          where: { customer_id: plain.customer_id }
        })

        if (notPre && notPre.appointment_confirmations === false ) {
          console.log("⏭ Skipping notification: appointment_confirmations OFF");
        } else {
          const doctorName = plain?.doctor_details?.name || "Doctor";
          const formattedDate = formatDate(plain.booking_date);
          const formattedTime = plain.time_slot;

          // Save in DB first
          await CommonService.create("Notification", {
            customer_id: plain.customer_id,
            category: "appointments",
            type: "doctorBooking",
            resource_type: "booking",
            resource_id: plain.id,

            title: "Doctor Appointment Confirmed",
            body: `Your appointment with ${doctorName} is confirmed`,

            metadata: {
              id: String(plain.id),
              doctorName,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime
            },

            status: "sent",
            isRead: false
          });

          // Send push notification
          await NotificationService.sendNotification(
            plain.customer_id,
            "Doctor Appointment Confirmed",
            `Your appointment with ${doctorName} is confirmed on ${formattedDate} at ${formattedTime}`,
            {
              type: "doctorBooking",
              id: String(plain.id),
              doctorName,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime
            }
          );
        }

      } catch (err) {
          console.error("Booking notification send failed:", err);
      }
    


      // ==========================================================
      // ================= MAIL SECTION ADDED ======================
      // ==========================================================
      try {
        await sendBookingEmails({
          eventType: "created",
          customerEmail: customer.email,
          customerName: customer.name || plain.patient_name,

          doctorEmail: doctor?.email || null,
          doctorName: plain.doctor_details?.name || "Doctor",

          hospitalEmail: hospital?.email || null,
          hospitalName: plain.hospital_details?.name || "Hospital",

          date: plain.booking_date,
          time: plain.time_slot
        });
      } catch (mailError) {
        console.error("Email sending failed (create):", mailError);
      }

      return res.status(200).json(new APIResponse(plain, 'Booking created successfully', 200));
      
    } catch (error) {
      console.error('createBooking error:', error);
      return res.status(500).json(new APIResponse({}, `Failed to create booking: ${error.message}`, 500));
    }
  }

  // ================================================================
  // ========================= UPDATE BOOKING ========================
  // ================================================================
  async updateBooking(req, res) {
    try {
      const { id } = req.params;
      const {
        doctor_id, customer_id, patient_name, patient_number, age, gender,
        booking_date, time_slot, hospital_id,
        //  insurance_id
      } = req.body;

      if (booking_date === undefined && time_slot === undefined && !req.body) {
        return res.status(400).json(new APIResponse({}, 'No fields to update', 400));
      }

      const existing = await CommonService.getSingleRecordByCondition('Booking', { id });
      if (!existing) return res.status(404).json(new APIResponse({}, 'Booking not found', 404));

      const existingPlain = existing.toJSON ? existing.toJSON() : existing;

      const encryptField = (value) =>
        value !== undefined
          ? (value === null ? null : CryptoJS.AES.encrypt(String(value), process.env.SECRET_KEY).toString())
          : undefined;

      const decryptField = (value) => 
        value ? CryptoJS.AES.decrypt(value, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8) || null : null;

      // === DOCTOR UPDATE ===
      let doctorDetails = existingPlain.doctor_details || {};
      let doctor = null;

      if (doctor_id !== undefined) {
        if (doctor_id) {
          doctor = await CommonService.getSingleRecordByCondition('Profession', { id: doctor_id, deleted_at: null }, [
            { model: db.profession_working_hours, as: 'working_hours' },
            {
              model: db.ProfessionSpeciality,
              as: 'specialitiesList',
              include: [{ model: db.Specialities, as: 'specialityInfo', attributes: ['name'] }]
            }
          ]);
          if (!doctor) return res.status(404).json(new APIResponse({}, 'Doctor not found', 404));

            // let specialtyString = 'General Practitioner';
            // if (doctor.specialitiesList?.length > 0) {
            //   specialtyString = doctor.specialitiesList
            //     .map(s => s.specialityInfo?.name)
            //     .filter(Boolean)
            //     .join(', ');
            // }
          doctorDetails = {
            name: encryptField(`${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()),
            specialty: doctor.designation || '',
            about: doctor.about || '',
            hospital: '',
            image: doctor.photo || null,
            latitude: doctor.latitude || null,
            longitude: doctor.longitude || null,
            working_hours: doctor.working_hours || []
          };
        } else {
          doctorDetails = {};
        }
      }

      // === HOSPITAL UPDATE ===
      let hospitalDetails = existingPlain.hospital_details || {};
      let hospital = null;
      const finalHospitalId = hospital_id !== undefined ? hospital_id : existingPlain.hospital_id;

      if (hospital_id !== undefined) {
        if (hospital_id) {
          hospital = await CommonService.getSingleRecordByCondition('Establishment', { id: hospital_id, deleted_at: null });
          if (!hospital) return res.status(404).json(new APIResponse({}, 'Hospital not found', 404));

          hospitalDetails = {
            name: encryptField(hospital.name || ''),
            address: encryptField(hospital.address || ''),
            phone: encryptField(hospital.phone || ''),
            latitude: hospital.latitude || null,
            longitude: hospital.longitude || null
          };
        } else {
          hospitalDetails = {};
        }
      } else if (finalHospitalId) {
        hospital = await CommonService.getSingleRecordByCondition('Establishment', { id: finalHospitalId, deleted_at: null });
        if (hospital) {
          hospitalDetails = {
            name: encryptField(hospital.name || ''),
            address: encryptField(hospital.address || ''),
            phone: encryptField(hospital.phone || ''),
            latitude: hospital.latitude || null,
            longitude: hospital.longitude || null
          };
        }
      }

      // === REMINDER TIME (recompute if date/slot changed) ===
      const newBookingDate = booking_date !== undefined ? booking_date : existingPlain.booking_date;
      const newTimeSlot = time_slot !== undefined ? time_slot : existingPlain.time_slot;

      let newreminder_time = computeReminderTime(newBookingDate, newTimeSlot);
      let reminder_sent = false;

      // If appointment changed and reminder would be in past, skip reminder
      const now = new Date();
      if (newreminder_time && newreminder_time < now) {
        console.log("⏭ Updated reminder time is already past → marking reminder_sent = true");
        reminder_sent = true;
        newreminder_time = null;
      }

      const updates = {
        doctor_id: doctor_id !== undefined ? doctor_id : existingPlain.doctor_id,
        customer_id: customer_id !== undefined ? customer_id : existingPlain.customer_id,
        patient_name: patient_name !== undefined ? encryptField(patient_name) : existingPlain.patient_name,
        patient_number: patient_number !== undefined ? encryptField(patient_number) : existingPlain.patient_number,
        patient_age: age !== undefined ? encryptField(age) : existingPlain.patient_age,
        patient_gender: gender !== undefined ? encryptField(gender) : existingPlain.patient_gender,
        booking_date: booking_date !== undefined ? booking_date : existingPlain.booking_date,
        time_slot: time_slot !== undefined ? time_slot : existingPlain.time_slot,
        hospital_id: finalHospitalId,
        // insurance_id: insurance_id !== undefined ? encryptField(insurance_id) : existingPlain.insurance_id,
        doctor_details: Object.keys(doctorDetails).length > 0 ? doctorDetails : null,
        hospital_details: Object.keys(hospitalDetails).length > 0 ? hospitalDetails : existingPlain.hospital_details,
        ...(existingPlain.status === '0'
          ? { reminder_time: newreminder_time, reminder_sent }
          : {})
      };

      const updated = await CommonService.update('Booking', id, updates);
      if (!updated || updated[0] === 0) return res.status(404).json(new APIResponse({}, 'Booking not found', 404));

      const freshBooking = await CommonService.getSingleRecordByCondition('Booking', { id });
      const result = freshBooking.toJSON ? freshBooking.toJSON() : freshBooking;

      // === DECRYPT FIELDS ===
      const decrypt = (f) => (f ? decryptField(f) : null);
      result.patient_name = decrypt(result.patient_name);
      result.patient_number = decrypt(result.patient_number);
      result.patient_age = result.patient_age ? Number(decrypt(result.patient_age)) : null;
      result.patient_gender = decrypt(result.patient_gender);
      // result.insurance_id = result.insurance_id ? Number(decrypt(result.insurance_id)) : null;

      if (result.doctor_details?.name)
        result.doctor_details.name = decrypt(result.doctor_details.name);

      if (result.hospital_details) {
        result.hospital_details.name = decrypt(result.hospital_details.name);
        result.hospital_details.address = decrypt(result.hospital_details.address);
        result.hospital_details.phone = decrypt(result.hospital_details.phone);
      }

      //==================== Admin Notification =====================
      sendAdminNotification({
        type: "doctor_booking_reschedule",
        title: "Doctor Booking Rescheduled",
        body: `Booking #${result.id} rescheduled for ${result.hospital_details?.name || "Hospital"}`,
        metadata: {
          bookingId: result.id,

          date: result.booking_date,
          formattedDate: formatDate(result.booking_date),

          time: result.time_slot,

          customerId: result.customer_id,

          doctorId: result.doctor_id || null,
          doctorName: result.doctor_details?.name || null,

          hospitalId: result.hospital_id || null,
          hospitalName: result.hospital_details?.name || null,

          patientName: result.patient_name || null,
          patientPhone: result.patient_number || null
        }
      });
      // ==========================================================
      // ===== CREATE NOTIFICATION (APPOINTMENT RESCHEDULED) ======
      // ==========================================================
      try {

        const notPre = await db.NotificationPreference.findOne({
          where: { customer_id: result.customer_id }
        })

        if (notPre && notPre.appointment_reschedule_cancel === false ) {
          console.log("⏭ Skipping notification: appointment_reschedule_cancel OFF");
        } else {
          const doctorName = result?.doctor_details?.name || "Doctor";
          const formattedDate = formatDate(result.booking_date);
          const formattedTime = result.time_slot;

          // Save reschedule notification in DB
          await CommonService.create("Notification", {
              customer_id: result.customer_id,
              category: "appointments",
              type: "doctorBookingReschedule",
              resource_type: "reschedule",
              resource_id: result.id,

              title: "Doctor Appointment Rescheduled",
              body: `Your appointment with ${doctorName} has been rescheduled at ${formattedTime} on ${formattedDate}`,

              metadata: {
                  id: String(result.id),
                  doctorName,
                  appointmentDate: formattedDate,
                  appointmentTime: formattedTime
              },

              status: "pending",
              isRead: false
          });

          // Send push notification
          await NotificationService.sendNotification(
              result.customer_id,
              "Doctor Appointment Rescheduled",
              `Your appointment with ${doctorName} has been rescheduled`,
              {
                  type: "doctorBooking",
                  id: String(result.id),
                  doctorName,
                  appointmentDate: formattedDate,
                  appointmentTime: formattedTime
              }
          );
        }

      } catch (err) {
          console.error("Reschedule notification send failed:", err);
      }


      // ==========================================================
      // ================= MAIL SECTION ADDED ======================
      // ==========================================================
      try {
        // Fetch customer details to get the email
        const customer = await CommonService.getSingleRecordByCondition('Customer', { 
          id: result.customer_id, 
          deleted_at: null 
        });

        if (!customer) {
          console.error("Customer not found for sending email");
        } else {
          await sendBookingEmails({
            eventType: "updated",
            customerEmail: customer.email,
            customerName: result.patient_name,

            doctorEmail: doctor?.email || null,
            doctorName: result.doctor_details?.name || "Doctor",

            hospitalEmail: hospital?.email || null,
            hospitalName: result.hospital_details?.name || "Hospital",

            date: result.booking_date,
            time: result.time_slot
          });
        }
      } catch (mailErr) {
        console.error("Email sending failed (update):", mailErr);
      }

      return res.status(200).json(new APIResponse(result, 'Booking updated successfully', 200));
    } catch (error) {
      console.error('updateBooking error:', error);
      return res.status(500).json(new APIResponse({}, `Failed to update booking: ${error.message}`, 500));
    }
  }

  // ================================================================
  // ========================= LIST BOOKINGS ========================
  // ================================================================
  async listBookings(req, res) {
    try {
      const customerId = req.params.customerId;
      const bookings = await CommonService.getMultipleRecordsByCondition('Booking', {
        customer_id: customerId,
      });

      const decryptField = (value) => {
        if (!value) return null;
        try {
          const decrypted = CryptoJS.AES.decrypt(value, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
          return decrypted || null;
        } catch (e) {
          console.error('Decryption error:', e);
          throw new Error('Decryption failed');
        }
      };

      const decryptedBookings = bookings.map(booking => {
        const plainBooking = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
        plainBooking.doctor_details.name = decryptField(plainBooking.doctor_details.name);
        plainBooking.hospital_details.name = decryptField(plainBooking.hospital_details.name);
        plainBooking.hospital_details.address = decryptField(plainBooking.hospital_details.address);
        plainBooking.hospital_details.phone = decryptField(plainBooking.hospital_details.phone);
        plainBooking.patient_name = decryptField(plainBooking.patient_name);
        plainBooking.patient_number = decryptField(plainBooking.patient_number);
        plainBooking.patient_age = plainBooking.patient_age ? Number(decryptField(plainBooking.patient_age)) : null;
        plainBooking.patient_gender = decryptField(plainBooking.patient_gender);
        // plainBooking.insurance_id = plainBooking.insurance_id ? Number(decryptField(plainBooking.insurance_id)) : null;
        return plainBooking;
      });

      return res
        .status(httpStatus.OK)
        .json(new APIResponse(decryptedBookings, 'Booking list fetched', httpStatus.OK));
    } catch (error) {
      console.error('listBookings error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, `Failed to fetch bookings: ${error.message}`, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      
      // Fetch the booking by ID
      const booking = await CommonService.getSingleRecordByCondition('Booking', {
        id: id,
      });

      if (!booking) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Booking not found', httpStatus.NOT_FOUND));
      }

      const decryptField = (value) => {
        if (!value) return null;
        try {
          const decrypted = CryptoJS.AES.decrypt(value, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
          return decrypted || null;
        } catch (e) {
          console.error('Decryption error:', e);
          throw new Error('Decryption failed');
        }
      };

      // Decrypt the booking data (same as listBookings)
      const plainBooking = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
      
      if (plainBooking.doctor_details) {
        plainBooking.doctor_details.name = decryptField(plainBooking.doctor_details.name);
      }
      
      if (plainBooking.hospital_details) {
        plainBooking.hospital_details.name = decryptField(plainBooking.hospital_details.name);
        plainBooking.hospital_details.address = decryptField(plainBooking.hospital_details.address);
        plainBooking.hospital_details.phone = decryptField(plainBooking.hospital_details.phone);
      }
      
      plainBooking.patient_name = decryptField(plainBooking.patient_name);
      plainBooking.patient_number = decryptField(plainBooking.patient_number);
      plainBooking.patient_age = plainBooking.patient_age ? Number(decryptField(plainBooking.patient_age)) : null;
      plainBooking.patient_gender = decryptField(plainBooking.patient_gender);
      // plainBooking.insurance_id = plainBooking.insurance_id ? Number(decryptField(plainBooking.insurance_id)) : null;

      return res
        .status(httpStatus.OK)
        .json(new APIResponse(plainBooking, 'Booking fetched successfully', httpStatus.OK));
        
    } catch (error) {
      console.error('getBookingById error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, `Failed to fetch booking: ${error.message}`, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // ================================================================
  // ========================= CANCEL BOOKING =======================
  // ================================================================
  async cancelBooking(req, res) {
    try {
      const id = req.params.id;
      

      // Fetch the booking first to get customer_id
      const booking = await CommonService.getSingleRecordByCondition("Booking", { id });
      
      if (!booking) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Booking not found', httpStatus.NOT_FOUND));
      }

      // Update the booking status to cancelled
      const updated = await CommonService.update('Booking', id, { status: "2", reminder_sent: true, reminder_time: null });

      if (!updated || updated[0] === 0) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Booking not found', httpStatus.NOT_FOUND));
      }

      // Convert to plain object if it's a Sequelize instance
      const plain = booking.toJSON ? booking.toJSON() : booking;

      // Decrypt helper function
      const decrypt = (v) => 
        v ? CryptoJS.AES.decrypt(v, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8) : null;


      // ==================== Admin Notification =====================
      sendAdminNotification({
        type: "doctor_booking_cancel",
        title: "Doctor Booking Cancelled",
        body: `Booking #${plain.id} has been cancelled by customer`,
        metadata: {
          bookingId: plain.id,

          // Date & time
          date: plain.booking_date,
          formattedDate: formatDate(plain.booking_date),
          time: plain.time_slot,

          // Customer
          customerId: plain.customer_id,

          // Doctor
          doctorId: plain.doctor_id || null,
          doctorName: plain.doctor_details?.name
            ? decrypt(plain.doctor_details.name)
            : null,

          // Hospital
          hospitalId: plain.hospital_id || null,
          hospitalName: plain.hospital_details?.name
            ? decrypt(plain.hospital_details.name)
            : null,

          // Patient
          patientName: plain.patient_name
            ? decrypt(plain.patient_name)
            : null,
          patientPhone: plain.patient_number
            ? decrypt(plain.patient_number)
            : null
        }
      });

      // ==========================================================
      // ========== CREATE NOTIFICATION (BOOKING CANCELLED) =======
      // ==========================================================
      try {
        const notPre = await db.NotificationPreference.findOne({
          where: { customer_id: plain.customer_id }
        })

        if (notPre && notPre.appointment_reschedule_cancel === false ) {
          console.log("⏭ Skipping notification: appointment_reschedule_cancel OFF");
        } else {
        
          const doctorName = decrypt(plain.doctor_details?.name) || "Doctor";
          const formattedDate = formatDate(plain.booking_date);
          const formattedTime = plain.time_slot;

          // === Save notification in DB ===
          await CommonService.create("Notification", {
            customer_id: plain.customer_id,
            category: "appointments",
            type: "doctorBookingCancel",
            resource_type: "cancelled",
            resource_id: plain.id,

            title: "Doctor Appointment Cancelled",
            body: `Your appointment on ${formattedTime} at ${formattedDate} with ${doctorName} has been cancelled`,

            metadata: {
              id: String(plain.id),
              doctorName,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime,
            },

            status: "pending",
            isRead: false
          });

          // === Send push notification ===
          await NotificationService.sendNotification(
            plain.customer_id,
            "Doctor Appointment Cancelled",
            `Your appointment with ${doctorName} has been cancelled`,
            {
              type: "doctorBooking",
              id: String(plain.id),
              doctorName,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime,
            }
          );
        }

      } catch (notifyErr) {
        console.error("Cancel notification send failed:", notifyErr);
      }

      // Fetch customer to get email address
      const customer = await CommonService.getSingleRecordByCondition('Customer', { 
        id: plain.customer_id, 
        deleted_at: null 
      });

      // Send email notifications only if customer exists
      if (customer && customer.email) {
        try {
          await sendBookingEmails({
            eventType: "cancelled",
            customerEmail: customer.email,
            customerName: decrypt(plain.patient_name) || customer.name,
            
            doctorEmail: plain.doctor_details?.email || null,
            doctorName: decrypt(plain.doctor_details?.name) || "Doctor",
            
            hospitalEmail: plain.hospital_details?.email || null,
            hospitalName: decrypt(plain.hospital_details?.name) || "Hospital",
            
            date: plain.booking_date,
            time: plain.time_slot
          });
        } catch (mailErr) {
          console.error("Email sending failed (cancel):", mailErr);
        }
      } else {
        console.error("Customer not found or email missing for booking cancellation notification");
      }

      return res
        .status(httpStatus.OK)
        .json(new APIResponse({}, 'Booking cancelled successfully', httpStatus.OK));

    } catch (error) {
      console.error('cancelBooking error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Failed to cancel booking', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

}

export default new BookingController();

// ===================================================================
// ================ CRON HELPER: BOOKING REMINDERS ====================
// ===================================================================

export async function processBookingReminders() {
  try {
    const now = new Date();

    // Round down to nearest hour for logs (optional)
    const logTime = new Date(now);
    logTime.setMinutes(0, 0, 0);
    console.log(`[BookingReminders] Running at ~${logTime.toISOString()}`);


    
    // 1. Find bookings that:
    //    - are pending (status '0')
    //    - have reminder_time <= now
    //    - reminder_sent = false
    const bookings = await db.Booking.findAll({
      where: {
        status: '0',
        reminder_sent: false,
        reminder_time: {
          [Op.lte]: now
        }
      }
    });

    if (!bookings.length) {
      console.log('[BookingReminders] No bookings require reminders');
      return;
    }

    console.log(`[BookingReminders] Found ${bookings.length} booking(s) for reminder`);

    for (const booking of bookings) {
      try {
        const plain = booking.toJSON();

        const customerId = plain.customer_id;

        // 2. Respect notification preference: appointment_reminders
        const pref = await db.NotificationPreference.findOne({
          where: { customer_id: customerId }
        });

        if (pref && pref.appointment_reminders === false) {
          console.log(
            `[BookingReminders] Customer ${customerId} has appointment_reminders OFF → marking as sent without sending`
          );
          await booking.update({ reminder_sent: true });
          continue;
        }

        /* ****************************************************
        NEW IMPORTANT FIX — AVOID DUPLICATE REMINDER NOTIFICATIONS
        **************************************************** */
        const existingReminder = await db.Notification.findOne({
          where: {
            customer_id: customerId,
            resource_id: plain.id,
            type: "doctorBookingReminder"
          }
        });

        if (existingReminder) {
          console.log(
            `[BookingReminders] Reminder already exists for booking ${plain.id}, skipping`
          );
          await booking.update({ reminder_sent: true });
          continue;
        }
        /* **************************************************** */

        // 3. Decrypt doctor name (optional)
        const decrypt = (v) =>
          v
            ? CryptoJS.AES.decrypt(v, process.env.SECRET_KEY).toString(
                CryptoJS.enc.Utf8
              )
            : null;

        const doctorName = plain.doctor_details?.name
          ? decrypt(plain.doctor_details.name)
          : 'Doctor';

        const appointmentDate = plain.booking_date;
        const appointmentTime = plain.time_slot;

        // 4. Save reminder notification in DB
        await db.Notification.create({
          customer_id: customerId,
          category: 'appointments',
          type: 'doctorBookingReminder',
          resource_type: 'reminder',
          resource_id: plain.id,

          title: 'Upcoming Doctor Appointment',
          body: `Reminder: appointment with ${doctorName} at ${appointmentTime}`,

          metadata: {
            id: String(plain.id),
            doctorName,
            appointmentDate,
            appointmentTime
          },

          isRead: false,
          status: 'pending'
        });

        // 5. Send push notification
        await NotificationService.sendNotification(
          customerId,
          'Upcoming Doctor Appointment',
          `Reminder: your appointment with ${doctorName} at ${appointmentTime}`,
          {
            type: 'doctorBookingReminder',
            id: String(plain.id),
            doctorName,
            appointmentDate,
            appointmentTime
          }
        );

        // 6. Mark reminder as sent
        await booking.update({ reminder_sent: true });

        console.log(
          `[BookingReminders] Reminder sent for booking ${plain.id} (customer ${customerId})`
        );
      } catch (errOne) {
        console.error(
          '[BookingReminders] Error processing single booking reminder:',
          errOne
        );
      }
    }
  } catch (err) {
    console.error('[BookingReminders] Global error:', err);
  }
}