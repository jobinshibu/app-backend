import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import enums from '../utils/utils.js';
import CryptoJS from 'crypto-js';
import { Op } from 'sequelize';
import CommonService from '../services/common.js';
import NotificationService from '../services/notificationService.js';
import { getJWTToken } from '../utils/jwt.helper.js';
import { sendEmail, sendPinpointMessage } from '../utils/SNSMessageHelper.js';
import twilio from 'twilio';
import axios from 'axios';
import pkg from 'body-parser';
const { text } = pkg;
import db from '../models/index.js';

class SendSmsEmailController {
  async sendOTPSms(userMobileNumber, OTP) {
    try {
      var smsBody = 'Use OTP ' + OTP + ', to verify your mobile number.';
      // return true;
      /*const msgResult = await sendPinpointMessage(
        `${process.env.AWS_SMS_SENDER_NO}`,
        `${userMobileNumber}`,
        smsBody
      );
      if (
        msgResult &&
        msgResult.status == 'success' &&
        msgResult['data']['MessageResponse']['Result'][`${userMobileNumber}`][
          'StatusCode'
        ] == 200
      ) {
        return true;
      }
      console.log('msgResult', JSON.stringify(msgResult));
      return msgResult;*/

      /*const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);

      const verification = await client.verify.v2
        .services('VA0abdaee3e66b18c28aa8531bc3802d0d ')
        .verifications.create({
          channel: 'sms',
          to: userMobileNumber
        });

      console.log('verification', verification);
      console.log(verification.status);

      return verification;*/
      let message = [];
      message.push({
        body: 'Use OTP ' + OTP + ', to verify your mobile number.',
        to: userMobileNumber
      });
      return await axios({
        method: 'post',
        url: process.env.CLICKSEND_BASE_URL + '/sms/send',
        data: {
          messages: message
        },
        auth: {
          username: process.env.CLICKSEND_USERNAME,
          password: process.env.CLICKSEND_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(function (response) {
          console.log('sms response', response.data);
          return response.data;
        })
        .catch(function (error) {
          console.log('sms error', error);
          return false;
        });
    } catch (e) {
      console.log('error', e);
      return false;
    }
  }
  async sendOTPEmail(userEmail, OTP) {
    try {
      var smsBody = 'Use OTP ' + OTP + ', to verify your email.';
      const msgResult = await sendEmail(userEmail, `Otp Verification`, smsBody);
      console.log('msgResult', JSON.stringify(msgResult));
      if (msgResult) {
        //sms send successfully
        return true;
      }
      return msgResult;
    } catch (e) {
      console.log('error', e);
      return false;
    }
  }

  async sendOTPWhatsApp(userMobileNumber, otp, phoneCode) {
    try {
      // Validate otp
      if (!otp) {
        throw new Error('OTP is required');
      }

      // Compose full mobile in international format (assuming phoneCode is in caller scope or env)
      // const phoneCode = process.env.DEFAULT_PHONE_CODE; // Fallback if not passed
      const mobileStr = String(userMobileNumber);
      const codeStr = String(phoneCode || '');
      const fullMobile = mobileStr.startsWith('+') ? mobileStr : `${codeStr}${mobileStr}`;
      
      console.log('Sending WhatsApp OTP to:', fullMobile);

      let existingOtp;
      try {
        existingOtp = await db.Otp.findOne({
          where: { fullMobile: fullMobile },
          paranoid: false
        });
        console.log('Existing OTP check result:', existingOtp ? 'Found' : 'Not found');
      } catch (dbError) {
        console.log('Database findOne error:', {
          message: dbError.message,
          sqlMessage: dbError.parent?.sqlMessage,
          stack: dbError.stack
        });
        throw dbError;
      }

      // Delete existing OTP if found
      if (existingOtp) {
        try {
          await existingOtp.destroy({ force: true });
          console.log('Deleted existing OTP for:', fullMobile);
        } catch (dbError) {
          console.log('Database destroy error:', {
            message: dbError.message,
            sqlMessage: dbError.parent?.sqlMessage,
            stack: dbError.stack
          });
          throw dbError;
        }
      }

      // Create new OTP record
      let newOtpRecord;
      try {
        newOtpRecord = await db.Otp.create({
          fullMobile: fullMobile,
          otp: otp,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log('Created new OTP record:', newOtpRecord.toJSON());
      } catch (dbError) {
        console.log('Database create error:', {
          message: dbError.message,
          sqlMessage: dbError.parent?.sqlMessage,
          stack: dbError.stack
        });
        throw dbError;
      }

      const payload = {
        messages: [
          {
            from: process.env.INFOBIP_SENDER_ID,
            to: fullMobile,
            messageId: process.env.INFOBIP_MESSAGE_ID,
            content: {
              templateName: "healine_otp",
              templateData: {
                body: { placeholders: [otp] },
                buttons: [{ type: "URL", parameter: `${otp}`, text: "Copy code" }]
              },
              language: 'en_GB'
            }
          }
        ]
      };

      console.log('Payload sent to Infobip:', JSON.stringify(payload, null, 2));

      let response;
      try {
        response = await axios.post(
          `${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/template`,
          payload,
          {
            headers: {
              Authorization: `App ${process.env.INFOBIP_API_KEY}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            timeout: 10000 // Add timeout to catch network issues
          }
        );
        console.log('Infobip WhatsApp OTP send response:', response.data);
      } catch (apiError) {
        console.log('Infobip API error:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          stack: apiError.stack
        });
        throw apiError;
      }

      return response.data;
    } catch (error) {
      console.log('WhatsApp OTP send error details:', {
        message: error.message,
        stack: error.stack,
        isDbError: error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeValidationError',
        env: {
          INFOBIP_API_KEY: process.env.INFOBIP_API_KEY ? 'Set' : 'Not Set',
          INFOBIP_BASE_URL: process.env.INFOBIP_BASE_URL,
          DB_HOST: process.env.DB_HOST || 'Not set',
          OTP_VALUE: otp // Log the received otp to check if it’s undefined
        }
      });
      throw error; // This will be caught by the Express error handler
    }
  }
  async verifyOTPWhatsApp(userMobileNumber, phoneCode, userEnteredOTP) {
    try {
      const fullMobile = userMobileNumber.startsWith('+') 
        ? userMobileNumber 
        : `${phoneCode}${userMobileNumber}`;

      // const mobileCountryCode = fullMobile.startsWith('+') 
      //   ? fullMobile.slice(0, fullMobile.length - 10) 
      //   : `+${phoneCode}`;
      // const mobileNo = fullMobile.startsWith('+') 
      //   ? fullMobile.slice(mobileCountryCode.length) 
      //   : userMobileNumber;

      console.log('phoneCode:', phoneCode);
      console.log('userMobileNumber:', userMobileNumber);
      console.log('Constructed fullMobile:', fullMobile);

      const otpRecord = await db.Otp.findOne({
        where: { fullMobile: fullMobile }
      });

      if (!otpRecord) {
        console.log('No OTP found for this number');
        return new APIResponse({}, enums.OTP_ERROR.OTP_NOT_FOUND, httpStatus.NOT_FOUND);
      }

      const now = new Date();
      const createdAt = new Date(otpRecord.created_at);
      if (now - createdAt > 10 * 60 * 1000) { // OTP expired after 10 minutes
        await otpRecord.destroy();
        console.log('OTP expired for this number');
        return new APIResponse({}, enums.OTP_ERROR.OTP_EXPIRED, httpStatus.FORBIDDEN);
      }

      console.log('Stored OTP:', otpRecord.otp);
      console.log('Input OTP:', userEnteredOTP);

      const isVerified = otpRecord.otp.toString() === userEnteredOTP.toString();

      if (isVerified) {
        console.log('OTP verification successful!');
        await otpRecord.destroy();

        const Customer = db.Customer;
        let customer = await Customer.findOne({
          where: {
            mobile_country_code: phoneCode,
            mobile_no: userMobileNumber,
            deleted_at: null
          },
          include: [
            {
              model: db.CustomerInsurance,
              as: 'insurances',
              attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
            }
          ]
        });

        if (!customer) {

          const deletedCustomer = await Customer.findOne({
            where: {
              mobile_country_code: phoneCode,
              mobile_no: userMobileNumber
            },
            paranoid: false // Include soft-deleted records
          });

          if (deletedCustomer && deletedCustomer.deleted_at) {
            console.log('Soft-deleted customer found, creating new customer:', fullMobile);
          } else {
            console.log('No customer found, creating new customer:', fullMobile);
          }

          customer = await Customer.create({
            mobile_country_code: phoneCode,
            mobile_no: userMobileNumber,
            first_name: '',
            last_name: '',
            age: null,
            email: null,
            password: null,
            gender: null,
            otp: null
          });
          console.log('New customer registered:', fullMobile);
          var responseStatus = httpStatus.CREATED;
          var message = enums.SUCCESS.REGISTRATION_SUCCESS;

          console.log("Creating default notification preferences for new customer:", customer.id);

          try {
              const fields = Object.keys(db.NotificationPreference.rawAttributes)
                  .filter(f => !["id", "customer_id", "created_at", "updated_at", "deleted_at"].includes(f));

              const prefData = { customer_id: customer.id };
              fields.forEach(field => prefData[field] = true); // enable all

              await db.NotificationPreference.create(prefData);
              console.log("Default notification preferences created.");
          } catch (prefErr) {
              console.error("Failed to create default notification preferences:", prefErr);
          }

        } else {
          console.log('Customer logged in:', fullMobile);
          var responseStatus = httpStatus.OK;
          var message = enums.SUCCESS.LOGIN_SUCCESS;
        }

        const token = getJWTToken({ id: customer.id, fullMobile: fullMobile });
        
         // ⭐ INSERT WELCOME NOTIFICATION LOGIC HERE (BEFORE RETURN)

        try {
            const isNewUser = responseStatus === httpStatus.CREATED;

            if (isNewUser) {
                await db.Notification.create({
                    customer_id: customer.id,
                    category: "system",
                    type: "welcome",
                    title: "Welcome to Healine!",
                    body: "We're excited to have you onboard 🎉",
                    metadata: { customerId: customer.id },
                    isRead: false,
                    status: "pending"
                });
            } else {
                await db.Notification.create({
                    customer_id: customer.id,
                    category: "system",
                    type: "welcome",
                    title: "Welcome Back!",
                    body: "Glad to see you again 👋",
                    metadata: { customerId: customer.id },
                    isRead: false,
                    status: "pending"
                });
            }

        } catch (err) {
            console.error("Failed to create welcome notification:", err);
        }
        
        // Use `customer.get({ plain: true })` for a plain JS object
        return new APIResponse(
          { token, customer: customer.get({ plain: true }) },
          message,
          responseStatus
        );
      } else {
        console.log('OTP verification failed: Incorrect OTP');
        return new APIResponse({}, enums.OTP_ERROR.OTP_INVALID, httpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log('WhatsApp OTP verify error', error.message);
      return new APIResponse({}, enums.COMMON.INTERNAL_SERVER_ERROR, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
  async verifyOTP(userMobileNumber, OTP) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);
      const verificationCheck = await client.verify.v2
        .services('VA0abdaee3e66b18c28aa8531bc3802d0d')
        .verificationChecks.create({
          code: OTP,
          to: userMobileNumber
        });
      console.log(verificationCheck);
      console.log(verificationCheck.status);
      if (verificationCheck && verificationCheck.status == 'approved') {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log('error', e);
      return false;
    }
  }
}

export default new SendSmsEmailController();