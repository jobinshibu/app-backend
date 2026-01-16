// ===========================================
// services/PaymentEmailService.js
// ===========================================
import { sendMail } from "../utils/Mailer.js";

// *** NEW ***
// Email template for Payment Success
function paymentSuccessTemplate({ customerName, serviceName, amount, date }) {
  return `
    <div style="font-family: Arial; padding: 20px; background:#f6f6f6;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:8px;">
        <h2 style="color:#0a84ff; text-align:center;">Payment Successful</h2>

        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your payment has been successfully processed.</p>

        <table style="width:100%; margin:20px 0; border-collapse:collapse;">
          <tr>
            <td style="padding:8px; font-weight:bold;">Service</td>
            <td style="padding:8px;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding:8px; font-weight:bold;">Amount Paid</td>
            <td style="padding:8px;">AED ${amount}</td>
          </tr>
          <tr>
            <td style="padding:8px; font-weight:bold;">Date</td>
            <td style="padding:8px;">${date}</td>
          </tr>
        </table>

        <p>Thank you for choosing Healine!</p>
        <p style="text-align:center; color:#888;">Healine Team</p>
      </div>
    </div>
  `;
}

// *** NEW ***
// Main function to send payment success email
export async function sendPaymentSuccessEmail({ to, customerName, serviceName, amount }) {
  const today = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  await sendMail({
    to,
    subject: "Payment Successful - Healine",
    html: paymentSuccessTemplate({
      customerName,
      serviceName,
      amount,
      date: today
    })
  });
}
