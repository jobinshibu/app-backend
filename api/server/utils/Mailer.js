// ===========================================
// utils/Mailer.js
// ===========================================
import nodemailer from "nodemailer";

// -------------------------------------------
// Configure transporter (change credentials)
// -------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., "smtp.gmail.com"
  port: process.env.SMTP_PORT, // e.g., 465
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // full email
    pass: process.env.SMTP_PASS  // app password
  }
});

// -------------------------------------------
// Generic Mail Sending Function
// -------------------------------------------
export async function sendMail({ to, subject, html, bcc = null }) {
  try {
    await transporter.sendMail({
      from: `"Healine" <${process.env.SMTP_USER}>`,
      to,
      bcc, // null-safe
      subject,
      html
    });
    console.log("Mail sent to", to, bcc ? `(BCC: ${bcc})` : "");
  } catch (err) {
    console.error("Mail sending failed:", err);
  }
}
