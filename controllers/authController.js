const User = require('../models/User');
const OTP = require('../models/OTP');
const TempCode = require('../models/TempCode');
const { sendEmail } = require('../services/emailService');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const logger = require('winston');

const validate = (method) => {
  switch (method) {
    case 'postLogin':
      return [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      ];
    case 'postRegister':
      return [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      ];
    case 'postVerifyOtp':
      return [
        body('email').isEmail().normalizeEmail(),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
        body('type').isIn(['registration', 'forgot_password']),
      ];
    case 'postForgotPassword':
      return [body('email').isEmail().normalizeEmail()];
    case 'postResetPassword':
      return [
        body('code').notEmpty(),
        body('password').isLength({ min: 8 }),
      ];
    default:
      return [];
  }
};

exports.postLogin = [
  validate('postLogin'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        logger.warn(`Login failed for ${email}: Invalid credentials`);
        return res.status(400).json({ error: 'Invalid email or password' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ error: 'Please verify your email first' });
      }
      const tempCode = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await TempCode.create({ code: tempCode, userId: user._id, expiresAt });
      logger.info(`Login successful for ${email}`);
      const redirectUri = req.query.redirect_uri || 'Nuera://auth-complete';
      res.json({ success: true, redirect: `${redirectUri}?code=${tempCode}` });
    } catch (err) {
      logger.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.postRegister = [
  validate('postRegister'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { username, email, password } = req.body;
    try {
      if (await User.findOne({ email })) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (await User.findOne({ username })) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      const user = new User({ username, email, password });
      await user.save();
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await OTP.create({ email, code: otp, expiresAt, type: 'registration' });
      await sendEmail(email, 'Verify Your Email', 'registrationEmail', { otp });
      logger.info(`Registration initiated for ${email}`);
      res.json({ success: true, redirect: `/verify-otp?email=${encodeURIComponent(email)}&type=registration` });
    } catch (err) {
      logger.error('Registration error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.postVerifyOtp = [
  validate('postVerifyOtp'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, otp, type } = req.body;
    try {
      const otpDoc = await OTP.findOne({ email, code: otp, type });
      if (!otpDoc || otpDoc.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      await OTP.deleteOne({ _id: otpDoc._id });
      const user = await User.findOne({ email });
      const tempCode = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await TempCode.create({ code: tempCode, userId: user._id, expiresAt });

      if (type === 'registration') {
        await User.updateOne({ email }, { isVerified: true });
        logger.info(`Email verified for ${email}`);
        const redirectUri = req.query.redirect_uri || 'Nuera://auth-complete';
        res.json({ success: true, redirect: `${redirectUri}?code=${tempCode}` });
      } else if (type === 'forgot_password') {
        logger.info(`OTP verified for password reset: ${email}`);
        res.json({ success: true, redirect: `/reset-password?code=${tempCode}` });
      }
    } catch (err) {
      logger.error('OTP verification error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.postForgotPassword = [
  validate('postForgotPassword'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Email not found' });
      }
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await OTP.create({ email, code: otp, expiresAt, type: 'forgot_password' });
      await sendEmail(email, 'Reset Your Password', 'forgotPasswordEmail', { otp });
      const redirectUrl = `/verify-otp?email=${encodeURIComponent(email)}&type=forgot_password`;
      res.json({ success: true, redirect: redirectUrl });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.postResetPassword = [
  validate('postResetPassword'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { code, password } = req.body;
    try {
      const tempCode = await TempCode.findOne({ code });
      if (!tempCode || tempCode.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }
      const user = await User.findById(tempCode.userId);
      user.password = password;
      await user.save();
      await TempCode.deleteOne({ _id: tempCode._id });
      logger.info(`Password reset successful for ${user.email}`);
      res.json({ success: true, message: 'Password reset successful. Please log in.' });
    } catch (err) {
      logger.error('Reset password error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const tempCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await TempCode.create({ code: tempCode, userId: user._id, expiresAt });
    logger.info(`Google login successful for ${user.email}`);
    const redirectUri = req.query.redirect_uri || 'Nuera://auth-complete';
    res.json({ success: true, redirect: `${redirectUri}?code=${tempCode}` });
  } catch (err) {
    logger.error('Google callback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.exchangeToken = async (req, res) => {
  const { code } = req.body;
  try {
    const tempCode = await TempCode.findOne({ code });
    if (!tempCode || tempCode.expiresAt < new Date()) {
      logger.warn(`Token exchange failed for code ${code}: Invalid or expired`);
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    const user = await User.findById(tempCode.userId);
    const token = generateToken(user);
    await TempCode.deleteOne({ _id: tempCode._id });
    logger.info(`Token exchanged for ${user.email}`);
    res.json({ token, username: user.name });
  } catch (err) {
    logger.error('Token exchange error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};