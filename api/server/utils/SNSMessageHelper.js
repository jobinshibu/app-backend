import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
AWS.config.update({
  region: process.env.SNS_REGION,
  accessKeyId: process.env.SNS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SNS_SECRET_ACCESS_KEY
});

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or use another email service
  auth: {
    user: process.env.GOOGLE_ACCOUNT_EMAIL, // replace with your email
    pass: process.env.GOOGLE_ACCOUNT_PASSWORD
    // pass: 'Elit@123#'
  },
    tls: {
    rejectUnauthorized: false
  }

});

console.log({
  service: 'Gmail', // or use another email service
  auth: {
    user: process.env.GOOGLE_ACCOUNT_EMAIL, // replace with your email
    pass: process.env.GOOGLE_ACCOUNT_PASSWORD
    // pass: 'Elit@123#'
  }
});
export const sendPinpointMessage = (senderPhoneNumber, phoneNumber, body) => {
  try {
    var originationNumber = senderPhoneNumber;
    console.log('originationNumber', originationNumber);
    // The recipient's phone number.
    var destinationNumber = phoneNumber;

    // The content of the SMS message.
    var message = body;

    var applicationId = '3ae877b559a044d6bd4eba8937689b99';

    var messageType = 'TRANSACTIONAL';

    var senderId = 'MySenderID';

    var params = {
      ApplicationId: applicationId,
      MessageRequest: {
        Addresses: {
          [destinationNumber]: {
            ChannelType: 'SMS'
          }
        },
        MessageConfiguration: {
          SMSMessage: {
            Body: message,
            MessageType: messageType,
            OriginationNumber: originationNumber,
            SenderId: senderId
          }
        }
      }
    };
    const pinpoint = new AWS.Pinpoint();
    return pinpoint
      .sendMessages(params)
      .promise()
      .then((message) => {
        // console.log('SMS sent successfully:', message);
        return {
          status: 'success',
          data: message,
          message: 'SMS sent successfully!'
        };
      })
      .catch((err) => {
        // console.log('Error sending SMS: ' + err);
        return {
          status: 'fail',
          data: err,
          message: err.message
        };
      });
  } catch (err) {
    return {
      status: 'fail',
      data: err,
      message: err
    };
  }
};

export const sendEmail = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.GOOGLE_ACCOUNT_EMAIL, // replace with your email
    to: email, // recipient's email
    subject: subject,
    text: message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return error;
  }
};
