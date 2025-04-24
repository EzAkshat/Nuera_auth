const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const logger = require('winston');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, template, data) => {
  try {
    const html = await ejs.renderFile(path.join(__dirname, `../emails/${template}.ejs`), data);
    await transporter.sendMail({
      from: `"Nuera" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to} with subject: ${subject}`);
  } catch (err) {
    logger.error(`Email sending failed to ${to}:`, err);
    throw err;
  }
};

module.exports = { sendEmail };