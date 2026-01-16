import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import enums from '../utils/utils.js';
import CryptoJS from 'crypto-js';
import { Op } from 'sequelize';
import CommonService from '../services/common.js';
import { getJWTToken } from '../utils/jwt.helper.js';
import SendSmsEmailController from './SendSmsEmailController.js';
import UserService from '../services/user.js';
import db from '../models/index.js';
import uploadFamilyImages from '../middelware/uploadFamilyImages.js';
import uploadCustomerImages from '../middelware/uploadCustomerImages.js';

function generateRandomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class UserController {
  //create user
  async Signup(req, res, next) {
    console.log("hereeeeeeeeeeeeeeeeee");
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        mobile_country_code,
        mobile_no,
        gender
      } = req.body;

      var checkEmailOrMobileExist =
        await CommonService.getSingleRecordByCondition('Customer', {
          [Op.or]: {
            email: email,
            mobile_no: mobile_no
          }
        });
      if (checkEmailOrMobileExist) {
        if (email == checkEmailOrMobileExist.email) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json(
              new APIResponse(
                {},
                'Email already exist.',
                httpStatus.BAD_REQUEST
              )
            );
        } else {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json(
              new APIResponse(
                {},
                'Mobile number already exist.',
                httpStatus.BAD_REQUEST
              )
            );
        }
      }

      let encryptedPassword = CryptoJS.AES.encrypt(
        password,
        process.env.SECRET_KEY
      ).toString();
      var data = {
        first_name,
        last_name,
        email,
        password: encryptedPassword,
        mobile_country_code,
        mobile_no,
        gender
      };

      var user = await CommonService.create('Customer', data);
      if (user) {
        delete user.password;
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(user, 'User created successfully', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json(
            new APIResponse(
              [],
              'Something went wrong while creating user.',
              httpStatus.INTERNAL_SERVER_ERROR
            )
          );
      }
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            { error },
            enums.COMMON.SERVER_ERROR,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async login(req, res, next) {
    try {
      const { userName, password } = req.body;
      var response = await CommonService.getSingleRecordByCondition(
        'Customer',
        {
          [Op.and]: [
            {
              [Op.or]: {
                email: userName,
                mobile_no: userName
              }
            },
            { deleted_at: null } // Check that the customer is not deleted
          ]
        }
      );
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse({}, 'Sorry! User not exist.', httpStatus.NOT_FOUND)
          );
      }
      let decryptPassword = CryptoJS.AES.decrypt(
        response.password,
        process.env.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);

      if (decryptPassword !== password) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.USER_RESPONSE.USER_PASSWORD_NOT_CORRECT,
              httpStatus.UNAUTHORIZED
            )
          );
      }
      response.token = getJWTToken({ id: response.id, email: response.email });
      console.log('token is ::', response.token);
      delete response.password;

      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            enums.USER_RESPONSE.USER_LOGIN_SUCCESSFULLY,
            httpStatus.OK
          )
        );
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.COMMON.SERVER_ERROR,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async sendOtp(req, res, next) {
    try {
      let otpNumber = Math.floor(1000 + Math.random() * 9000);
      const { mobile, phone_code, email, is_email } = req.body;
      var result = null;

      if (is_email == 0) {
        result = await CommonService.getSingleRecordByCondition('Customer', {
          mobile_no: mobile
        });
      } else {
        result = await CommonService.getSingleRecordByCondition('Customer', {
          email: email
        });
      }

      if (result) {
        if (is_email == 0) {
          var mob_no = `${phone_code}${mobile}`;
          await SendSmsEmailController.sendOTPSms(mob_no, otpNumber);
        } else {
          await SendSmsEmailController.sendOTPEmail(email, otpNumber);
        }

        await CommonService.update('Customer', result.id, { otp: otpNumber });
        return res.status(httpStatus.OK).json(
          new APIResponse(
            // { otp: otpNumber },
            {},
            enums.USER_RESPONSE.OTP_SEND_SUCCESFULLY,
            httpStatus.OK
          )
        );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              'Sorry your account is not exist please check.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (e) {
      console.log('error', e);
    }
  }

  async sendOtpOnEmail(req, res, next) {
    try {
      let otpNumber = Math.floor(1000 + Math.random() * 9000);
      const { email } = req.body;
      var result = null;

      result = await CommonService.getSingleRecordByCondition('Customer', {
        email: email
      });

      if (result) {
        await SendSmsEmailController.sendOTPEmail(email, otpNumber);
        await CommonService.update('Customer', result.id, { otp: otpNumber });
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              { otp: otpNumber },
              {},
              enums.USER_RESPONSE.OTP_SEND_SUCCESFULLY,
              httpStatus.OK
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              'Sorry your account is not exist please check.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (e) {
      console.log('error', e);
    }
  }

  //otp  verfication
  async OtpVerify(req, res, next) {
    try {
      const { mobile, otp, email, is_email } = req.body;
      var response = null;
      if (is_email == 0) {
        const data = await CommonService.getSingleRecordByCondition(
          'Customer',
          {
            mobile_no: mobile
          }
        );
        if (!data) {
          return res
            .status(httpStatus.OK)
            .json(
              new APIResponse(
                {},
                enums.USER_RESPONSE.USER_MOBILE_NOT_VALID,
                httpStatus.CONFLICT
              )
            );
        }
        // var optVerified = await SendSmsEmailController.verifyOTP(
        //   `${data.mobile_country_code}${data.mobile_no}`,
        //   otp
        // );
        // if (optVerified) {
        //   response = data;
        // }

        response = await CommonService.getSingleRecordByCondition('Customer', {
          mobile_no: mobile,
          otp: otp
        });
      } else {
        const data = await CommonService.getSingleRecordByCondition(
          'Customer',
          {
            email: email
          }
        );
        if (!data) {
          return res
            .status(httpStatus.OK)
            .json(
              new APIResponse(
                {},
                'Sorry! Email not found.',
                httpStatus.CONFLICT
              )
            );
        }
        response = await CommonService.getSingleRecordByCondition('Customer', {
          email: email,
          otp: otp
        });
      }

      if (response) {
        response.token = getJWTToken({
          id: response.id,
          mobile: response.mobile,
          email: response.email
        });
        delete response.password;
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              enums.USER_RESPONSE.USER_LOGIN_SUCCESSFULLY,
              httpStatus.OK
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse({}, 'Invalid OTP', httpStatus.CONFLICT));
      }
    } catch (e) {
      console.log('error', e);
    }
  }

  // Fetch customer by mobile number (with family)
  async getCustomerByMobile(req, res, next) {
    try {
      const { mobile } = req.params;
      const customer = await db.Customer.findOne({
        where: { mobile_no: mobile },
        include: [
          {
            model: db.Family,
            as: 'familyMembers'
          },
          {
            model: db.CustomerInsurance,
            as: 'insurances',
            attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
          }
        ]
      });
      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
      }
      const plain = customer.toJSON();
      delete plain.password;
      delete plain.otp;
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(plain, 'Customer fetched.', httpStatus.OK));
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // Update customer details by id (with family in response)
  async updateCustomerById(req, res, next) {
    try {
      uploadCustomerImages(req, res, async (err) => {
        if (err) {
          return res
            .status(httpStatus.BAD_REQUEST)
            .json(new APIResponse({}, err.message, httpStatus.BAD_REQUEST));
        }

        const { id } = req.params;
        const updateData = { ...req.body };
        {
          const dobInput = req.body.date_of_birth ?? req.body.dateOfBirth;
          if (dobInput) {

            const normalizedInput = String(dobInput).trim().replace(/\//g, '-');

            const match = /^([0-9]{2})-([0-9]{2})-([0-9]{4})$/.exec(normalizedInput);
            if (!match) {
              return res
                .status(httpStatus.BAD_REQUEST)
                .json(new APIResponse({}, 'Invalid date format. Use DD-MM-YYYY.', httpStatus.BAD_REQUEST));
            }
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12) {
              return res
                .status(httpStatus.BAD_REQUEST)
                .json(new APIResponse({}, 'Invalid date. Day must be 1-31 and month 1-12.', httpStatus.BAD_REQUEST));
            }
            // Build a date safely; use UTC noon to avoid timezone shifting the day
            const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            // Ensure components match (catches invalid like 31-02-2020)
            if (
              parsedDate.getUTCFullYear() !== year ||
              parsedDate.getUTCMonth() !== month - 1 ||
              parsedDate.getUTCDate() !== day
            ) {
              return res
                .status(httpStatus.BAD_REQUEST)
                .json(new APIResponse({}, 'Invalid date. Please check day/month values.', httpStatus.BAD_REQUEST));
            }
            updateData.dateOfBirth = parsedDate;
          }
        }
        // Handle profile image upload only
        if (req.file) {
          updateData.image = `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/customerImages/${req.file.filename}`;
        }

        delete updateData.id;
        delete updateData.password;
        delete updateData.otp;

        const customer = await db.Customer.findOne({ where: { id } });
        if (!customer) {
          return res
            .status(httpStatus.NOT_FOUND)
            .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
        }

        await db.Customer.update(updateData, {
          where: { id: customer.id },
          individualHooks: true
        });

        const refreshed = await db.Customer.findOne({
          where: { id: customer.id },
          include: [
            {
              model: db.Family,
              as: 'familyMembers'
            }
          ]
        });
        const plain = refreshed.toJSON();
        delete plain.password;
        delete plain.otp;
        return res
          .status(httpStatus.OK)
          .json(new APIResponse(plain, 'Customer updated successfully.', httpStatus.OK));
      });
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  
  // Add family members by customer id
async addFamilyMembers(req, res, next) {
  try {
    // Apply Multer middleware
    uploadFamilyImages(req, res, async (err) => {
      if (err) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, err.message, httpStatus.BAD_REQUEST));
      }

      const { id } = req.params;
      const customer = await db.Customer.findOne({ where: { id } });
      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
      }

      const payload = req.body;
      if (!payload || (Array.isArray(payload) && payload.length === 0)) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Family payload is required.', httpStatus.BAD_REQUEST));
      }

      const normalize = (item) => {
        const normalizedData = {
          image: req.files?.image ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/familyImages/${req.files.image[0].filename}` : item.image || null,
          emirates_id_front: req.files?.emirates_id_front ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdFront/${req.files.emirates_id_front[0].filename}` : item.emirates_id_front || null,
          emirates_id_back: req.files?.emirates_id_back ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdBack/${req.files.emirates_id_back[0].filename}` : item.emirates_id_back || null,
          passport_front: req.files?.passport_front ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdFront/${req.files.passport_front[0].filename}` : item.passport_front || null,
          passport_back: req.files?.passport_back ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdBack/${req.files.passport_back[0].filename}` : item.passport_back || null,
          passport_id: item.passport_id || null,
          gender: item.gender || null,
          first_name: item.first_name,
          last_name: item.last_name,
          relation: item.relation,
          visa_status: item.visa_status || null,
          emirates_id: item.emirates_id || null,
          nationality: item.nationality || null,
          verified: item.verified || false,
          customer_id: customer.id,
          mobile_number: item.mobile_number || null,
          country_code: item.country_code || null,
        };

        // Date validation and parsing for date_of_birth, emirates_date, and passport_date
        const validateAndParseDate = (dateInput, fieldName) => {
          if (dateInput) {
            const normalizedInput = String(dateInput).trim().replace(/\//g, '-');
            const match = /^([0-9]{2})-([0-9]{2})-([0-9]{4})$/.exec(normalizedInput);
            if (!match) {
              throw new Error(`Invalid date format for ${fieldName}. Use DD-MM-YYYY.`);
            }
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12) {
              throw new Error(`Invalid date for ${fieldName}. Day must be 1-31 and month 1-12.`);
            }
            const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            if (
              parsedDate.getUTCFullYear() !== year ||
              parsedDate.getUTCMonth() !== month - 1 ||
              parsedDate.getUTCDate() !== day
            ) {
              throw new Error(`Invalid date for ${fieldName}. Please check day/month values.`);
            }
            return parsedDate;
          }
          return null;
        };

        normalizedData.date_of_birth = validateAndParseDate(item.date_of_birth, 'date_of_birth');
        normalizedData.emirates_date = validateAndParseDate(item.emirates_date, 'emirates_date');
        normalizedData.passport_date = validateAndParseDate(item.passport_date, 'passport_date');

        return normalizedData;
      };

      if (Array.isArray(payload)) {
        const records = payload.map(normalize);
        await db.Family.bulkCreate(records);
      } else {
        const record = normalize(payload);
        await db.Family.create(record);
      }

      const refreshed = await db.Customer.findOne({
        where: { id: customer.id },
        include: [
          { model: db.Family, as: 'familyMembers' }
        ]
      });
      const plain = refreshed.toJSON();
      delete plain.password;
      delete plain.otp;
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(plain, 'Family members added successfully.', httpStatus.OK));
    });
  } catch (error) {
    console.log('error', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
  }
}
async editFamily(req, res, next) {
  try {
    uploadFamilyImages(req, res, async (err) => {
      if (err) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, err.message, httpStatus.BAD_REQUEST));
      }

      const { id, familyId } = req.params;
      const customer = await db.Customer.findOne({ where: { id } });
      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
      }

      const family = await db.Family.findOne({ where: { id: familyId, customer_id: id } });
      if (!family) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Family member not found.', httpStatus.NOT_FOUND));
      }

      const payload = req.body;
      if (!payload || (!payload.first_name && !payload.last_name && !payload.gender && !payload.relation && !payload.image && !payload.date_of_birth && !payload.visa_status && !payload.emirates_id && !payload.emirates_date && !payload.nationality && !req.files)) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'At least one field is required to update.', httpStatus.BAD_REQUEST));
      }

      // Date validation and parsing for date_of_birth, emirates_date, and passport_date
      const validateAndParseDate = (dateInput, fieldName) => {
        if (dateInput) {
          const normalizedInput = String(dateInput).trim().replace(/\//g, '-');
          const match = /^([0-9]{2})-([0-9]{2})-([0-9]{4})$/.exec(normalizedInput);
          if (!match) {
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(new APIResponse({}, `Invalid date format for ${fieldName}. Use DD-MM-YYYY.`, httpStatus.BAD_REQUEST));
          }
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          if (day < 1 || day > 31 || month < 1 || month > 12) {
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(new APIResponse({}, `Invalid date for ${fieldName}. Day must be 1-31 and month 1-12.`, httpStatus.BAD_REQUEST));
          }
          const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
          if (
            parsedDate.getUTCFullYear() !== year ||
            parsedDate.getUTCMonth() !== month - 1 ||
            parsedDate.getUTCDate() !== day
          ) {
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(new APIResponse({}, `Invalid date for ${fieldName}. Please check day/month values.`, httpStatus.BAD_REQUEST));
          }
          return parsedDate;
        }
        return null;
      };

      const updateData = {
        first_name: payload.first_name || family.first_name,
        last_name: payload.last_name || family.last_name,
        gender: payload.gender || family.gender,
        relation: payload.relation || family.relation,
        image: req.files?.image ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/familyImages/${req.files.image[0].filename}` : payload.image || family.image,
        emirates_id_front: req.files?.emirates_id_front ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdFront/${req.files.emirates_id_front[0].filename}` : payload.emirates_id_front || family.emirates_id_front,
        emirates_id_back: req.files?.emirates_id_back ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdBack/${req.files.emirates_id_back[0].filename}` : payload.emirates_id_back || family.emirates_id_back,
        passport_front: req.files?.passport_front ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdFront/${req.files.passport_front[0].filename}` : payload.passport_front || family.passport_front,
        passport_back: req.files?.passport_back ? `${process.env.IMAGE_PATH_URL || 'http://13.126.236.126:8084'}/emiratesIdBack/${req.files.passport_back[0].filename}` : payload.passport_back || family.passport_back,
        passport_id: payload.passport_id || family.passport_id,
        visa_status: payload.visa_status || family.visa_status,
        emirates_id: payload.emirates_id || family.emirates_id,
        nationality: payload.nationality || family.nationality,
        verified: payload.verified !== undefined ? payload.verified : family.verified,
        mobile_number: payload.mobile_number || family.mobile_number,
        country_code: payload.country_code || family.country_code,
      };

      // Apply validation and parsing for all date fields
      const dobResult = validateAndParseDate(payload.date_of_birth, 'date_of_birth');
      if (dobResult && dobResult.status === httpStatus.BAD_REQUEST) return dobResult; // Return if validation fails
      updateData.date_of_birth = dobResult !== null ? dobResult : family.date_of_birth;

      const emiratesDateResult = validateAndParseDate(payload.emirates_date, 'emirates_date');
      if (emiratesDateResult && emiratesDateResult.status === httpStatus.BAD_REQUEST) return emiratesDateResult; // Return if validation fails
      updateData.emirates_date = emiratesDateResult !== null ? emiratesDateResult : family.emirates_date;

      const passportDateResult = validateAndParseDate(payload.passport_date, 'passport_date');
      if (passportDateResult && passportDateResult.status === httpStatus.BAD_REQUEST) return passportDateResult; // Return if validation fails
      updateData.passport_date = passportDateResult !== null ? passportDateResult : family.passport_date;

      await db.Family.update(updateData, { where: { id: familyId, customer_id: id } });

      const refreshed = await db.Customer.findOne({
        where: { id: customer.id },
        include: [
          { model: db.Family, as: 'familyMembers' }
        ]
      });
      const plain = refreshed.toJSON();
      delete plain.password;
      delete plain.otp;
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(plain, 'Family member updated successfully.', httpStatus.OK));
    });
  } catch (error) {
    console.log('error', error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
  }
}
  async deleteFamily(req, res, next) {
    try {
      const { id, familyId } = req.params;
      const customer = await db.Customer.findOne({ where: { id } });
      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
      }

      const family = await db.Family.findOne({ where: { id: familyId, customer_id: id } });
      if (!family) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Family member not found.', httpStatus.NOT_FOUND));
      }

      await db.Family.destroy({ where: { id: familyId, customer_id: id } });


      const refreshed = await db.Customer.findOne({
        where: { id: customer.id },
        include: [
          { model: db.Family, as: 'familyMembers' }
        ]
      });
      const plain = refreshed.toJSON();
      delete plain.password;
      delete plain.otp;
      return res
        .status(httpStatus.OK)
        .json(new APIResponse(plain, 'Family member deleted successfully.', httpStatus.OK));
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }
  async emailOtpVerify(req, res, next) {
    try {
      const { otp, email } = req.body;
      var response = null;
      const data = await CommonService.getSingleRecordByCondition('Customer', {
        email: email
      });
      if (!data) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse({}, 'Sorry! Email not found.', httpStatus.CONFLICT)
          );
      }
      response = await CommonService.getSingleRecordByCondition('Customer', {
        email: email,
        otp: otp
      });

      if (response) {
        delete response.password;
        delete response.otp;
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              'OTP verified successfully.',
              httpStatus.OK
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse({}, 'Invalid OTP', httpStatus.CONFLICT));
      }
    } catch (e) {
      console.log('error', e);
    }
  }
  async resetPassword(req, res, next) {
    try {
      const { user_id, password, email } = req.body;
      const result = await CommonService.getSingleRecordByCondition(
        'Customer',
        {
          id: user_id,
          email: email
        }
      );
      if (result) {
        let newPassword = CryptoJS.AES.encrypt(
          password,
          process.env.SECRET_KEY
        ).toString();

        await CommonService.update('Customer', result.id, {
          password: newPassword,
          otp: 0
        });
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse({}, 'Password reset successfully.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              'Sorry user account is not exist.',
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (e) {
      console.log('error', e);
    }
  }
  async updateUser(req, res, next) {
    try {

      const customerId = req.user.id;
      const { first_name, last_name, email } = req.body;

      // Check if customer exists
      const existingCustomer = await CommonService.getSingleRecordByCondition(
        'Customer',
        { id: customerId }
      );
      console.log(existingCustomer);
      if (!existingCustomer) {
        return res.status(httpStatus.NOT_FOUND).json(
          new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND)
        );
      }

      // Check if email already exists for another customer
      const duplicate = await CommonService.getSingleRecordByCondition(
        'Customer',
        {
          email: email,
          id: { [Op.ne]: customerId }
        }
      );

      if (duplicate) {
        return res.status(httpStatus.CONFLICT).json(
          new APIResponse({}, 'Email already in use.', httpStatus.CONFLICT)
        );
      }
      console.log("upppppppppppppppppppppp");
      // Update fields
      const updated = await CommonService.update('Customer', customerId, {
        first_name,
        last_name,
        email
      });
      console.log
      if (updated) {
        return res.status(httpStatus.OK).json(
          new APIResponse({}, 'Customer updated successfully.', httpStatus.OK)
        );
      } else {
        return res.status(httpStatus.BAD_REQUEST).json(
          new APIResponse({}, 'Update failed.', httpStatus.BAD_REQUEST)
        );
      }
    } catch (error) {
      console.log('error', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  async sendOtpWhatsApp(req, res) {
    try {
      const { mobile, phone_code } = req.body;
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
      const result = await SendSmsEmailController.sendOTPWhatsApp(mobile, otp, phone_code);
      res.status(httpStatus.OK).json(new APIResponse({ message: 'OTP sent', otp }, enums.SUCCESS.OTP_SENT || 'Senting OTP...', httpStatus.OK));
    } catch (error) {
      console.log('Error in sendOtpWhatsApp:', error.message);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, enums.COMMON.INTERNAL_SERVER_ERROR, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  async OtpVerifyWhatsApp(req, res, next) {
    try {
      const { mobile, pin, phone_code } = req.body; // Add phone_code

      // 2. Verify OTP via SendSmsEmailController
      const fullMobile = `${phone_code}${mobile}`; // Match the send logic
      const verified = await SendSmsEmailController.verifyOTPWhatsApp(mobile, phone_code, pin);
      if (!verified || verified.status !== httpStatus.OK) {
        // Forward the error APIResponse to client with correct status
        return res.status(verified ? verified.status : httpStatus.CONFLICT).json(verified || new APIResponse({}, 'Invalid OTP', httpStatus.CONFLICT));
      }
      return res.status(httpStatus.OK).json(verified);

    } catch (error) {
      console.log('WhatsApp OTP verify error', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }

  // Request OTP for updating customer's mobile number
  async requestMobileUpdateOtp(req, res, next) {
    try {
      const { existing_mobile, existing_phone_code, new_mobile, new_phone_code } = req.body;

      if (!existing_mobile || !existing_phone_code || !new_mobile || !new_phone_code) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'All fields are required.', httpStatus.BAD_REQUEST));
      }

      // Identify the customer attempting update
      let customer = null;
      if (req.user?.id) {
        customer = await db.Customer.findOne({ where: { id: req.user.id } });
      }
      if (!customer) {
        customer = await db.Customer.findOne({
          where: {
            mobile_country_code: existing_phone_code,
            mobile_no: existing_mobile
          }
        });
      }
      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Existing mobile not found for any customer.', httpStatus.NOT_FOUND));
      }

      // Generate OTP and send via InfoBip WhatsApp flow (also persists in otps table there)
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const fullMobile = `${new_phone_code}${new_mobile}`;

      // Ensure single active OTP per number before sending
      await db.Otp.destroy({ where: { fullMobile } });
      await SendSmsEmailController.sendOTPWhatsApp(String(new_mobile), otp, String(new_phone_code));

      return res
        .status(httpStatus.OK)
        .json(new APIResponse({}, 'OTP sent to new mobile number.', httpStatus.OK));
    } catch (error) {
      console.log('requestMobileUpdateOtp error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // Verify OTP and update customer's mobile number with deduplication
  async verifyMobileUpdateOtp(req, res, next) {
    try {
      const { existing_mobile, existing_phone_code, new_mobile, new_phone_code, otp } = req.body;

      if (!existing_mobile || !existing_phone_code || !new_mobile || !new_phone_code || !otp) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'All fields are required.', httpStatus.BAD_REQUEST));
      }

      const fullMobile = `${new_phone_code}${new_mobile}`;
      const otpRecord = await db.Otp.findOne({ where: { fullMobile } });
      if (!otpRecord) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'OTP not found for the new number.', httpStatus.NOT_FOUND));
      }

      // Expire after 10 minutes similar to WhatsApp flow
      const now = new Date();
      const createdAt = new Date(otpRecord.created_at);
      if (now - createdAt > 10 * 60 * 1000) {
        await otpRecord.destroy();
        return res
          .status(httpStatus.FORBIDDEN)
          .json(new APIResponse({}, 'OTP expired.', httpStatus.FORBIDDEN));
      }

      const isMatch = otpRecord.otp?.toString() === otp.toString();
      if (!isMatch) {
        return res
          .status(httpStatus.CONFLICT)
          .json(new APIResponse({}, 'Invalid OTP.', httpStatus.CONFLICT));
      }

      let updatedCustomer = null;
      // OTP is valid, proceed with update in a transaction
      await db.sequelize.transaction(async (t) => {
        // Resolve the updater customer
        let customer = null;
        if (req.user?.id) {
          customer = await db.Customer.findOne({ where: { id: req.user.id }, transaction: t, lock: t.LOCK.UPDATE });
        }
        if (!customer) {
          customer = await db.Customer.findOne({
            where: {
              mobile_country_code: existing_phone_code,
              mobile_no: existing_mobile
            },
            transaction: t,
            lock: t.LOCK.UPDATE
          });
        }
        if (!customer) {
          throw new Error('Existing customer not found');
        }

        // Check if another customer already has the new number
        const duplicate = await db.Customer.findOne({
          where: {
            mobile_country_code: new_phone_code,
            mobile_no: new_mobile
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (duplicate && duplicate.id !== customer.id) {
          // Delete the duplicate customer as per requirement
          await db.Customer.destroy({ where: { id: duplicate.id }, transaction: t });
        }

        // Update customer's mobile to new number
        await db.Customer.update(
          { mobile_country_code: new_phone_code, mobile_no: new_mobile },
          { where: { id: customer.id }, transaction: t }
        );

        // Invalidate OTP
        await otpRecord.destroy({ transaction: t });

        // Fetch the updated customer
        updatedCustomer = await db.Customer.findOne({
          where: { id: customer.id },
          transaction: t
        });
      });

      if (!updatedCustomer) {
        throw new Error('Failed to fetch updated customer details');
      }

      return res
        .status(httpStatus.OK)
        .json(new APIResponse(
          {
            id: updatedCustomer.id,
            first_name: updatedCustomer.first_name,
            last_name: updatedCustomer.last_name,
            email: updatedCustomer.email,
            mobile_country_code: updatedCustomer.mobile_country_code,
            mobile_no: updatedCustomer.mobile_no,
            gender: updatedCustomer.gender,
            dateOfBirth: updatedCustomer.date_of_birth,
            nationality: updatedCustomer.nationality,
            age: updatedCustomer.age,
            image: updatedCustomer.image,
            // insurance_id: updatedCustomer.insurance_id,
            created_at: updatedCustomer.created_at,
            updated_at: updatedCustomer.updated_at,
            deleted_at: updatedCustomer.deleted_at
          },
          'Mobile number updated successfully.',
          httpStatus.OK
        ));
    } catch (error) {
      console.log('verifyMobileUpdateOtp error', error);
      const message = error?.message || 'Server error.';
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, message, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // Request OTP for soft-deleting customer
  async requestDeleteCustomerOtp(req, res, next) {
    try {
      const { mobile, phone_code } = req.body;

      if (!mobile || !phone_code) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Mobile number and phone code are required.', httpStatus.BAD_REQUEST));
      }

      // Check if customer exists and is not already soft-deleted
      const customer = await db.Customer.findOne({
        where: {
          mobile_country_code: phone_code,
          mobile_no: mobile,
          deleted_at: null
        }
      });

      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'Customer not found or already deleted.', httpStatus.NOT_FOUND));
      }

      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const fullMobile = `${phone_code}${mobile}`;

      // Ensure single active OTP per number
      await db.Otp.destroy({ where: { fullMobile } });

      // Send OTP via WhatsApp
      await SendSmsEmailController.sendOTPWhatsApp(mobile, otp, phone_code);

      return res
        .status(httpStatus.OK)
        .json(new APIResponse({}, 'OTP sent to mobile number for deletion.', httpStatus.OK));
    } catch (error) {
      console.log('requestDeleteCustomerOtp error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, 'Server error.', httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // Verify OTP and soft-delete customer
  async verifyDeleteCustomerOtp(req, res, next) {
    try {
      const { mobile, phone_code, otp } = req.body;

      if (!mobile || !phone_code || !otp) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(new APIResponse({}, 'Mobile number, phone code, and OTP are required.', httpStatus.BAD_REQUEST));
      }

      const fullMobile = `${phone_code}${mobile}`;

      // Verify OTP
      const otpRecord = await db.Otp.findOne({ where: { fullMobile } });
      if (!otpRecord) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(new APIResponse({}, 'OTP not found for this number.', httpStatus.NOT_FOUND));
      }

      // Check OTP expiration (10 minutes)
      const now = new Date();
      const createdAt = new Date(otpRecord.created_at);
      if (now - createdAt > 10 * 60 * 1000) {
        await otpRecord.destroy();
        return res
          .status(httpStatus.FORBIDDEN)
          .json(new APIResponse({}, 'OTP expired.', httpStatus.FORBIDDEN));
      }

      // Verify OTP match
      const isMatch = otpRecord.otp?.toString() === otp.toString();
      if (!isMatch) {
        return res
          .status(httpStatus.CONFLICT)
          .json(new APIResponse({}, 'Invalid OTP.', httpStatus.CONFLICT));
      }

      // Soft-delete customer in a transaction
      await db.sequelize.transaction(async (t) => {
        // Find customer
        const customer = await db.Customer.findOne({
          where: {
            mobile_country_code: phone_code,
            mobile_no: mobile,
            deleted_at: null
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!customer) {
          throw new Error('Customer not found or already deleted.');
        }

        // Soft-delete by setting deleted_at
        await db.Customer.update(
          { deleted_at: new Date() },
          { where: { id: customer.id }, transaction: t }
        );

        // Invalidate OTP
        await otpRecord.destroy({ transaction: t });
      });

      return res
        .status(httpStatus.OK)
        .json(new APIResponse({}, 'Customer account soft-deleted successfully.', httpStatus.OK));
    } catch (error) {
      console.log('verifyDeleteCustomerOtp error:', error);
      const message = error?.message || 'Server error.';
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, message, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  async softDeleteUser(req, res, next) {
    try {
      const { user_id } = req.params;

      if (!user_id || isNaN(user_id) || user_id <= 0) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(
            new APIResponse({}, 'Valid user_id is required.', httpStatus.BAD_REQUEST)
          );
      }

      // Check if the user exists and is not already soft-deleted
      const customer = await CommonService.getSingleRecordByCondition(
        'Customer',
        {
          id: user_id,
          deleted_at: null
        }
      );

      if (!customer) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(
            new APIResponse(
              {},
              'User not found or already deleted.',
              httpStatus.NOT_FOUND
            )
          );
      }

      // Perform soft deletion by setting deleted_at
      await CommonService.update(
        'Customer',
        user_id,
        { deleted_at: new Date() },
        { individualHooks: true }
      );

      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            {},
            'User soft-deleted successfully.',
            httpStatus.OK
          )
        );
    } catch (error) {
      console.log('softDeleteUser error:', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.COMMON.SERVER_ERROR,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
}

export default new UserController();


  // async addUserInsurance(req, res, next) {
  //   try {
  //     const {
  //       id,
  //       insurance_id,
  //       plan_id,
  //       policy_number,
  //       policy_holder_name,
  //       premium_amount,
  //       coverage_amount,
  //       start_date,
  //       end_date,
  //       status,
  //       policy_type
  //     } = req.body;
  //     var msg = 'Insurance added successfully.';
  //     if (id && +id > 0) {
  //       await CommonService.update('CustomerInsurance', id, {
  //         insurance_id,
  //         plan_id,
  //         policy_number,
  //         policy_holder_name,
  //         premium_amount,
  //         coverage_amount,
  //         start_date,
  //         end_date,
  //         status,
  //         policy_type
  //       });
  //       msg = 'Insurance updated successfully.';
  //     } else {
  //       await CommonService.create('CustomerInsurance', {
  //         customer_id: req.user.id,
  //         insurance_id,
  //         plan_id,
  //         policy_number,
  //         policy_holder_name,
  //         premium_amount,
  //         coverage_amount,
  //         start_date,
  //         end_date,
  //         status,
  //         policy_type
  //       });
  //     }
  //     return res
  //       .status(httpStatus.OK)
  //       .json(new APIResponse({}, msg, httpStatus.OK));
  //   } catch (e) {
  //     console.log('error', e);
  //   }
  // }
  // async getUserInsuranceInfo(req, res, next) {
  //   try {
  //     const customerId = req.user.id;
  //     var custInsInfo = await UserService.getCustomerInsuranceInfo(customerId);
  //     return res
  //       .status(httpStatus.OK)
  //       .json(
  //         new APIResponse(custInsInfo, 'User Insurance Info.', httpStatus.OK)
  //       );
  //   } catch (e) {
  //     console.log('error', e);
  //   }
  // }
  // async deleteUserInsurance(req, res, next) {
  //   try {
  //     const customerId = req.user.id;
  //     var custInsInfo = await CommonService.deleteByCondition(
  //       'CustomerInsurance',
  //       { customer_id: customerId }
  //     );
  //     return res
  //       .status(httpStatus.OK)
  //       .json(
  //         new APIResponse(
  //           custInsInfo,
  //           'Customer Insurance deleted successfully.',
  //           httpStatus.OK
  //         )
  //       );
  //   } catch (e) {
  //     console.log('error', e);
  //   }
  // }

   /*async addCard(req, res, next) {
    try {
      const { card_holder_name, card_number, expiry_date, token, card_type } =
        req.body;
      const card = await CommonService.getSingleRecordByCondition(
        'UserCardDetail',
        { card_number: card_number, user_id: req.user.id }
      );
      if (card) {
        return res
          .status(httpStatus.OK)
          .json(new APIResponse({}, 'Card already added', httpStatus.CONFLICT));
      }
      let data = {
        user_id: req.user.id,
        card_holder_name: card_holder_name,
        card_number: card_number,
        expiry_date: expiry_date,
        // cvv: cvv
        card_type: card_type,
        token: token
      };
      const response = await CommonService.create('UserCardDetail', data);
      if (response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'Card added successfully.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.COMMON.SOMETHING_WENT_WRONG,
              httpStatus.INTERNAL_SERVER_ERROR
            )
          );
      }
    } catch (e) {
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            {},
            enums.COMMON.SOMETHING_WENT_WRONG,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async getUserCards(req, res, next) {
    try {
      const userId = req.user.id;

      const response = await CommonService.getMultipleRecordsByCondition(
        'UserCardDetail',
        { user_id: userId }
      );
      if (response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(response, 'User card data found.', httpStatus.OK)
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.COMMON.DATA_NOT_FOUND,
              httpStatus.NOT_FOUND
            )
          );
      }
    } catch (e) {
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            {},
            enums.COMMON.SOMETHING_WENT_WRONG,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async deleteCard(req, res, next) {
    try {
      if (!req.params.cardId || req.params.cardId <= 0) {
        return res
          .status(400)
          .json(
            new APIResponse({}, 'Card Id is required.', httpStatus.BAD_REQUEST)
          );
      }

      const isCardAddedInBooking =
        await HotelBookingServices.checkCardAddedInFutureBooking(
          req.params.cardId
        );

      if (isCardAddedInBooking) {
        return res
          .status(400)
          .json(
            new APIResponse(
              {},
              'Card is added in future booking id-' +
                isCardAddedInBooking.bookingDetail.id +
                ' please first change card and then try to remove it.',
              httpStatus.BAD_REQUEST
            )
          );
      }
      const response = await CommonService.deleteById(
        'UserCardDetail',
        req.params.cardId
      );
      if (response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              enums.COMMON.RECORD_DELETED_SUCCESSFULLY,
              httpStatus.OK
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.COMMON.SOMETHING_WENT_WRONG,
              httpStatus.INTERNAL_SERVER_ERROR
            )
          );
      }
    } catch (e) {
      console.log('error', e);
      console.log(e);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(new APIResponse({}, e.message, httpStatus.INTERNAL_SERVER_ERROR));
    }
  }

  // user signup
  async userDetails(req, res, next) {
    try {
      console.log('req________________', req.files);
      // if (!req?.file?.filename) {
      //   return res.send("Image is required");
      // }
      // const res1 = await UserService.getUserByMobile(req.body.mobile)
      // if (!res1) {
      //   return res
      //     .status(httpStatus.OK)
      //     .json(
      //       new APIResponse(
      //         {},
      //         enums.USER_RESPONSE.USER_MOBILE_NOT_VALID,
      //         httpStatus.CONFLICT
      //       )
      //     );
      // }
      let data = {
        name: req.body.name,
        dob: req.body.dob,
        email: req.body.email,
        mobile: req.body.mobile,
        idNumber: req.body.idNumber,
        loginType: req.body.loginType,
        facebookId: req.body.facebookId,
        googleId: req.body.googleId,
        twitterId: req.body.twitterId,
        linkedinId: req.body.linkedinId,
        paymentType: req.body.paymentType
      };
      if (req.body.password) {
        var ciphertext = CryptoJS.AES.encrypt(
          req.body.password,
          'secret key 123'
        ).toString();
        data.password = ciphertext;
      }
      // var bytes = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
      // var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      // console.log("original decrypt password", decryptedData);
      if (data.loginType == 1) {
        if (data.facebookId === '') {
          return res.status(401).json('facebookId is required');
        }
        let updateid = await UserService.updateSocialMediaId(data);
      } else if (data.loginType == 2) {
        if (data.googleId === '') {
          return res.status(401).json('googleId is required');
        }
        let updateid = await UserService.updateSocialMediaId(data);
      } else if (data.loginType == 3) {
        if (data.twitterId === '') {
          return res.status(401).json('twitterId is required');
        }
        let updateid = await UserService.updateSocialMediaId(data);
      } else if (data.loginType == 4) {
        if (data.linkedinId === '') {
          return res.status(401).json('linkedinId is required');
        }
        let updateid = await UserService.updateSocialMediaId(data);
      }
      if (req?.files?.image) {
        let data1 = {
          image: req?.files?.image[0]?.filename,
          media_type: 'USER_IMAGE',
          parent_id: req.user.id
        };
        let result = await MediaServices.createImage(data1, req.user.id);
      }

      if (req.files?.passportImage) {
        data.id_proof_type = 1;
        let data1 = {
          image: req?.files?.passportImage[0]?.filename,
          media_type: 'PASSPORT_IMAGE',
          parent_id: req.user.id
        };
        await MediaServices.deletePreviouslyAddedIdProofImages(req.user.id);
        let passportImage = await MediaServices.createImage(data1, req.user.id);
      }
      // const result = await UserService.updateVerification(reqdata)
      let response = await UserService.updateUser(req.user.id, data);
      let temp = await UserService.findUserImage(req.user.id);
      if (temp?.userImage?.image || temp?.passportImage?.image) {
        temp.userimage = temp?.userImage?.image || '';
        temp.passportimage = temp?.passportImage?.image || '';
        delete temp?.userImage;
        delete temp?.passportImage;
      } else {
        temp.userimage = '';
        temp.passportimage = '';
      }

      //send registration sms
      await SendSmsController.sendRegistrationSms(req.user.id);
      await SendEmailController.sendRegistrationEmail(req.user.id);

      if (response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              temp,
              enums.USER_RESPONSE.USER_UPDATED_SUCCESSFULLY,
              httpStatus.OK
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              temp,
              enums.USER_RESPONSE.USER_NOT_UPDATED,
              httpStatus.CONFLICT
            )
          );
      }
    } catch (error) {
      console.log(error);
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            {},
            enums.USER_RESPONSE.ERROR_ADDING_USER,
            httpStatus.OK
          )
        );
    }
  }

  // login user
  

  // get user
  async getUser(req, res, next) {
    // console.log("????????????????????????", req);
    try {
      let response = await UserService.getUserById(req.user.id);
      console.log('response ::');
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.USER_RESPONSE.USER_NOT_EXIST,
              httpStatus.NOT_FOUND
            )
          );
      }
      delete response.password;
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            enums.USER_RESPONSE.USER_FETCHED_SUCCESSFULLY,
            httpStatus.OK
          )
        );
    } catch (error) {
      console.log('error', error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.COMMON.SERVER_ERROR,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  // update user
  async update(req, res, next) {
    try {
      let userData = await UserService.getUserById(req.user.id);
      if (!userData) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.USER_RESPONSE.USER_NOT_EXIST,
              httpStatus.NOT_FOUND
            )
          );
      }
      let ciphertext = CryptoJS.AES.encrypt(
        req.body.password,
        'secret key 123'
      ).toString();
      let data = {
        id: req.user.id,
        name: req.body.name,
        dob: req.body.dob,
        email: req.body.email,
        password: ciphertext
      };
      let response = await UserService.updateUserProfile(data);
      // console.log("456", response);
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              enums.USER_RESPONSE.ERROR_UPDATING_USER,
              httpStatus.BAD_REQUEST
            )
          );
      }
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            enums.USER_RESPONSE.USER_UPDATED_SUCCESSFULLY,
            httpStatus.OK
          )
        );
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.USER_RESPONSE.ERROR_UPDATING_USER,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async updateUser(req, res, next) {
    try {
      let userData = await UserService.getUserById(req.user.id);
      if (!userData) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.USER_RESPONSE.USER_NOT_EXIST,
              httpStatus.NOT_FOUND
            )
          );
      }
      let userExist = await UserService.checkUserMobileEmailExistExceptUserId(
        req.user.id,
        req.body.email,
        req.body.mobile
      );
      if (userExist) {
        if (userExist.email == req.body.email) {
          return res
            .status(httpStatus.OK)
            .json(
              new APIResponse(
                {},
                'Email already exist. Please use different email.',
                httpStatus.CONFLICT
              )
            );
        } else {
          return res
            .status(httpStatus.OK)
            .json(
              new APIResponse(
                {},
                'Mobile already exist. Please use different Mobile.',
                httpStatus.CONFLICT
              )
            );
        }
      }

      let data = {
        id: req.user.id,
        address: req.body.address,
        phone_code: req.body.phone_code,
        email: req.body.email,
        mobile: req.body.mobile
      };
      let response = await UserService.updateUserProfile(data);
      // console.log("456", response);
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              enums.USER_RESPONSE.ERROR_UPDATING_USER,
              httpStatus.BAD_REQUEST
            )
          );
      }
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            enums.USER_RESPONSE.USER_UPDATED_SUCCESSFULLY,
            httpStatus.OK
          )
        );
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.USER_RESPONSE.ERROR_UPDATING_USER,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
  async updateFcmToken(req, res, next) {
    try {
      let userData = await UserService.getUserById(req.user.id);
      if (!userData) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              {},
              enums.USER_RESPONSE.USER_NOT_EXIST,
              httpStatus.NOT_FOUND
            )
          );
      }

      let data = {
        fcm_token: req.body.fcm_token,
        id: req.user.id
      };
      let response = await UserService.updateUserProfile(data);
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              'Something went wrong while updating FCM token.',
              httpStatus.BAD_REQUEST
            )
          );
      }
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            'FCM token updated successfully.',
            httpStatus.OK
          )
        );
    } catch (error) {
      console.log(error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.USER_RESPONSE.ERROR_UPDATING_USER,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  // delete user
  async delete(req, res, next) {
    try {
      if (!req.params.id) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse({}, 'User Id is required.', httpStatus.UNAUTHORIZED)
          );
      }
      let response = await UserService.deleteUser(req.params.id);
      console.log('response', response);
      if (!response) {
        return res
          .status(httpStatus.OK)
          .json(
            new APIResponse(
              response,
              enums.USER_RESPONSE.ERROR_DELETING_USER,
              httpStatus.BAD_REQUEST
            )
          );
      }
      return res
        .status(httpStatus.OK)
        .json(
          new APIResponse(
            response,
            enums.USER_RESPONSE.USER_DELETED_SUCCESSFULLY,
            httpStatus.OK
          )
        );
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            {},
            enums.USER_RESPONSE.ERROR_DELETING_USER,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  }*/