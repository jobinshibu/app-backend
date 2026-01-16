import moment from 'moment';
import crypto from 'crypto';
import https from 'https';

export const allowLegacyRenegotiationforNodeJsOptions = {
  httpsAgent: new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
  })
};
export const getPaymentTypeOfBooking = (number) => {
  switch (number) {
    case 1:
      return 'Cash';
    case 2:
      return 'Credit Card';
    case 3:
      return 'Cheque';
    case 4:
      return 'Direct Bill';
    default:
      return '';
  }
};
export const evaluate_email = (template, fields) => {
  for (var prop in fields) {
    template = template.replace(
      new RegExp('{' + prop + '}', 'g'),
      fields[prop]
    );
  }
  return template;
};
export const getTaxExemptionIdsOnBookings = (taxExemptionData) => {
  return taxExemptionData.map((item) => item.tax_id);
};
export const getShiftArrivalDepartureDateTime = (date, type) => {
  var date1 = '';
  if (type == 1) {
    date1 = String(date + ' 14:00');
  } else {
    date1 = date + ' 11:00';
  }
  console.log('date1', date1);
  let momentOne = moment(date1);
  momentOne.utcOffset(60);
  const dateTime = momentOne.toISOString(true);
  console.error('MomentOne is:', dateTime);
  return dateTime;
};
export const getTaxValueForShift = (price, percentage = 18) => {
  return +(price * (+percentage / 100)).toFixed(2);
};
export const getShiftDateTime = () => {
  let momentOne = moment();
  momentOne.utcOffset(60);
  // momentOne.utc();
  // const dateTime = momentOne.toString();
  // const dateTime = momentOne.toISOString();
  const dateTime = momentOne.toISOString(true);
  // const dateTime = momentOne.format('yyyy-mm-ddThh:mm:ss.nnn+hh:mm').toString();
  console.error('MomentOne is:', dateTime);
  return dateTime;
};

export const get4DigitRandomNumber = () => {
  var val = Math.floor(1000 + Math.random() * 9000);
  return val;
};

export const getUniqueRoomCategoryAndQty = (room_details) => {
  console.log('room_details', room_details);
  let roomsChecks = [];
  room_details.map((item) => {
    let arr1 = {
      room_category_id: item.room_category_id,
      quantity: item.number_of_room
    };
    let room_duplicate = false;
    roomsChecks.map((room, idx) => {
      console.log('idx', idx);
      if (room.room_category_id == item.room_category_id) {
        roomsChecks[idx]['quantity'] =
          parseInt(roomsChecks[idx]['quantity']) +
          parseInt(item.number_of_room);
        room_duplicate = true;
      }
    });
    if (!room_duplicate) {
      roomsChecks.push(arr1);
    }
  });
  return roomsChecks;
};

export const getOffset = (currentPage = 1, listPerPage = 10) => {
  return parseInt((currentPage - 1) * listPerPage);
};
