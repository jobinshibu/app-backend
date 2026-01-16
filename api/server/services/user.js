/* eslint-disable no-useless-catch */
import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
import { Model, Op } from 'sequelize';
import e from 'express';

class UserService {
  // sign up user
  async createUser(data) {
    console.log('gdeab : ', data);
    try {
      const response = await database.User.create(data);
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // get user by dynamic object
  async getUserByObj(Mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          [Op.or]: [
            {
              mobile: Mobile
            },
            {
              email: Mobile
            }
          ]
        },
        include: [
          {
            model: database.Media,
            where: { media_type: 'USER_IMAGE' },
            attributes: ['image', 'media_type'],
            as: 'userImage',
            required: false
          },
          {
            model: database.Media,
            where: {
              media_type: 'PASSPORT_IMAGE'
            },
            attributes: ['image', 'media_type'],
            as: 'passportImage',
            required: false
          }
        ]
      });
      console.log('responser : ', dataParse(response));
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // check user exist by email and mobile
  async FindUserMobile(mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          [Op.and]: [
            {
              mobile: mobile
            },
            {
              isVerified: '0'
            }
          ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  //find verigied or not
  async FindUserMobileAndEmail(mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          [Op.and]: [
            {
              mobile: mobile
            },
            {
              isVerified: '1'
            }
          ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }
  // get user list by dynamic object
  async getUserListByObj(obj) {
    try {
      const response = await database.User.findAll(obj);
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  //get user and otp
  async findUserOtp(mobile, data) {
    try {
      const response = await database.User.findOne({
        // attributes: ["id", "mobile", "otp"],
        where: {
          [Op.and]: [
            {
              mobile: mobile
            },
            {
              otp: data
            }
          ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // Save Infobip WhatsApp OTP pinId in the DB
  // async updateWhatsappPinId(mobile, pinId) {
  //   try {
  //     const response = await database.User.update(
  //       { otp_pin_id: pinId }, // Make sure the column exists in DB schema
  //       { where: { mobile } }
  //     );
  //     return dataParse(response);
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async getWhatsappPinId(mobile) {
  //   try {
  //     const response = await database.User.findOne({
  //       where: { mobile },
  //       attributes: ['otp_pin_id']
  //     });
  //     return dataParse(response);
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  // get user by the user id

  async getUserById(userId) {
    try {
      const response = await database.Customer.findOne({
        where: { id: userId }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // update user verified field
  async updateVerification(data) {
    try {
      // if (data.email && data.password) {
      // }
      const response = await database.User.update(
        { isVerified: 1 },
        {
          where: { mobile: data.mobile }
        }
      );
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  async updateMobileVerifiaction(data) {
    try {
      const response = await database.User.update(
        { otp: data.otp },
        {
          where: {
            mobile: data.mobile
          }
        }
      );
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // update specific userdetails
  async updateUser(id, data) {
    console.log('data - ', data);
    if (data.email && data.password) {
      // data.isVerified: 1
      // let temp = {...data};
      data['isVerified'] = 1;
    }
    try {
      const response = await database.User.update(data, {
        where: {
          id: id
          // [Op.or]: [
          //   {
          //     id: id
          //   },
          //   {
          //     mobile: data.mobile
          //   }
          // ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  //user profile update by id
  async updateUserProfile(data) {
    try {
      const response = await database.User.update(data, {
        where: { id: data.id }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  //update social media id using logintype
  async updateSocialMediaId(data) {
    try {
      const response = await database.User.update(data, {
        where: {
          [Op.and]: [
            {
              mobile: data.mobile
            },
            {
              facebookId: data.facebookId
            }
          ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  // delete user
  async softDelete(userId) {
    try {
      const response = await database.User.update(
        { isDeleted: true },
        { where: { id: userId } }
      );
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }
  async deleteUser(userId) {
    try {
      const response = await database.User.destroy({
        where: {
          id: userId
        }
      });
      /*console.log('Hello');
      const bookings = await database.Booking.findAll({
        where: {
          user_id: userId
        },
        attributes: ['id', 'user_id']
      });
      const bookingData = await dataParse(bookings);
      const bookingIds = bookingData?.map((item) => item.id);
      console.log('bookingIds', bookingIds);
      if (bookingIds && bookingIds.length > 0) {
        await database.Booking.destroy({
          where: {
            id: {
              [Op.in]: bookingIds
            }
          }
        });
        await database.BookingDetail.destroy({
          where: {
            booking_id: {
              [Op.in]: bookingIds
            }
          }
        });
        await database.BookingItem.destroy({
          where: {
            booking_id: {
              [Op.in]: bookingIds
            }
          }
        });
        await database.BookingFolio.destroy({
          where: {
            booking_id: {
              [Op.in]: bookingIds
            }
          }
        });
        await database.BookingFolioCharge.destroy({
          where: {
            booking_id: {
              [Op.in]: bookingIds
            }
          }
        });
        await database.BookingUserAccess.destroy({
          where: {
            booking_id: {
              [Op.in]: bookingIds
            }
          }
        });
      }*/
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  async findUserImage(id) {
    try {
      const result = await database.User.findOne({
        where: {
          id: id
        },
        attributes: [
          'id',
          'name',
          'dob',
          'mobile',
          'facebookId',
          'googleId',
          'twitterId',
          'linkedinId',
          'email',
          'idNumber',
          'otp',
          'isVerified',
          'paymentType'
        ],
        include: [
          {
            model: database.Media,
            where: { media_type: 'USER_IMAGE' },
            attributes: ['image', 'media_type'],
            as: 'userImage',
            required: false
          },
          {
            model: database.Media,
            where: {
              media_type: 'PASSPORT_IMAGE'
            },
            attributes: ['image', 'media_type'],
            as: 'passportImage',
            required: false
          }
        ]
      });
      console.log('result', result);
      return dataParse(result);
    } catch (e) {
      console.log('error', e);
    }
  }

  //find valid mobile
  async getUserByMobile(mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          [Op.and]: [
            {
              mobile: mobile
            },
            {
              isVerified: '0'
            }
          ]
        },
        attributes: ['otp']
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  async getUserByMobile1(mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          mobile: mobile
        },
        attributes: ['otp']
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }
  async checkUserMobileEmailExistExceptUserId(userId, email, mobile) {
    try {
      const response = await database.User.findOne({
        where: {
          id: {
            [Op.ne]: userId
          },
          [Op.or]: [
            {
              mobile: mobile
            },
            {
              email: email
            }
          ]
        }
      });
      return dataParse(response);
    } catch (error) {
      throw error;
    }
  }

  async update(mobile) {
    try {
      const update = await database.User.update({
        where: {
          mobile: mobile
        },
        isVerified: '1'
      });
      return dataParse(update);
    } catch (e) {
      console.log('ERROR', e);
    }
  }

  // async getCustomerInsuranceInfo(custId) {
  //   try {
  //     const response = await database.CustomerInsurance.findOne({
  //       where: {
  //         customer_id: custId
  //       },
  //       include: [
  //         {
  //           model: database.Insurance,
  //           as: 'insuranceInfo',
  //           attributes: ['id', 'name', 'logo']
  //         },
  //         {
  //           model: database.InsurancePlan,
  //           as: 'planInfo',
  //           attributes: ['id', 'name']
  //         }
  //       ]
  //     });
  //     return dataParse(response);
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}

export default new UserService();
