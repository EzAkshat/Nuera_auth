const User = require('../models/User');
const OTP = require('../models/OTP');
const TempCode = require('../models/TempCode');
const UnverifiedUser = require('../models/UnverifiedUser');
const { sendEmail } = require('../services/emailService');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const logger = require('winston');
const axios = require('axios');

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
      if (!user) {
        logger.warn(`Login failed for ${email}: Invalid credentials`);
        return res.status(400).json({ error: 'Invalid email or password' });
      }
      if (!user.password) {
        logger.warn(`Login failed for ${email}: Account uses Google sign-in`);
        return res.status(400).json({ error: 'This account uses Google sign-in. Please use Google to log in.' });
      }
      if (!(await user.comparePassword(password))) {
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
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ error: 'Email or username already registered' });
      }

      const apiKey = process.env.ABSTRACT_API_KEY;
      const verificationUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`;
      const verificationResponse = await axios.get(verificationUrl);
      const { deliverability, is_valid_format } = verificationResponse.data;

      if (is_valid_format.value && deliverability === 'DELIVERABLE') {
        const unverifiedUser = await UnverifiedUser.findOne({ email });
        if (unverifiedUser) {
          if (unverifiedUser.otpExpires > new Date()) {
            return res.status(400).json({ error: 'Verification already in progress. Please check your email.' });
          } else {
            await UnverifiedUser.deleteOne({ _id: unverifiedUser._id });
          }
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
        const newUnverifiedUser = new UnverifiedUser({
          username,
          email,
          password,
          otp,
          otpExpires,
        });
        await newUnverifiedUser.save();

        await sendEmail(email, 'Verify Your Email', 'registrationEmail', { otp });

        logger.info(`Registration initiated for ${email}`);
        res.json({ success: true, redirect: `/verify-otp?email=${encodeURIComponent(email)}&type=registration` });
      } else {
        logger.warn(`Invalid email attempt: ${email}`);
        res.status(400).json({ error: "This email doesn't appear to exist." });
      }
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
      if (type === 'registration') {
        const unverifiedUser = await UnverifiedUser.findOne({ email });
        if (!unverifiedUser || unverifiedUser.otp !== otp || unverifiedUser.otpExpires < new Date()) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        let newUser;
        try {
          newUser = new User({
            username: unverifiedUser.username,
            email: unverifiedUser.email,
            password: unverifiedUser.password,
            isVerified: true,
          });
          await newUser.save();
        } catch (err) {
          if (err.code === 11000) {
            return res.status(400).json({ error: 'Username or email already taken. Please choose another.' });
          }
          throw err;
        }
        await UnverifiedUser.deleteOne({ _id: unverifiedUser._id });
        logger.info(`Email verified and user created for ${email}`);
        const tempCode = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await TempCode.create({ code: tempCode, userId: newUser._id, expiresAt });
        const redirectUri = req.query.redirect_uri || 'Nuera://auth-complete';
        res.json({ success: true, redirect: `${redirectUri}?code=${tempCode}` });
      } else if (type === 'forgot_password') {
        const otpDoc = await OTP.findOne({ email, code: otp, type });
        if (!otpDoc || otpDoc.expiresAt < new Date()) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        await OTP.deleteOne({ _id: otpDoc._id });
        const user = await User.findOne({ email });
        const tempCode = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await TempCode.create({ code: tempCode, userId: user._id, expiresAt });
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
      const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
      await OTP.create({ email, code: otp, expiresAt, type: 'forgot_password' });
      await sendEmail(email, 'Reset Your Password', 'forgotPasswordEmail', { otp });
      const redirectUrl = `/verify-otp?email=${encodeURIComponent(email)}&type=forgot_password`;
      res.json({ success: true, redirect: redirectUrl });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  },
];

exports.postResendOtp = async (req, res) => {
  const { email, type } = req.body;
  try {
    if (type === 'registration') {
      const unverifiedUser = await UnverifiedUser.findOne({ email });
      if (!unverifiedUser) {
        return res.status(400).json({ error: 'No registration in progress for this email' });
      }
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
      unverifiedUser.otp = otp;
      unverifiedUser.otpExpires = otpExpires;
      await unverifiedUser.save();
      await sendEmail(email, 'Verify Your Email', 'registrationEmail', { otp });
      res.json({ success: true, message: 'OTP resent' });
    } else if (type === 'forgot_password') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Email not found' });
      }
      await OTP.deleteMany({ email, type });
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
      await OTP.create({ email, code: otp, expiresAt, type });
      await sendEmail(email, 'Reset Your Password', 'forgotPasswordEmail', { otp });
      res.json({ success: true, message: 'OTP resent' });
    } else {
      res.status(400).json({ error: 'Invalid type' });
    }
  } catch (err) {
    logger.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    if (req.user) {
      const user = req.user;
      const tempCode = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await TempCode.create({ code: tempCode, userId: user._id, expiresAt });
      logger.info(`Google login successful for ${user.email}`);
      res.render('authComplete', { code: tempCode, appUrl });
    } else {
      res.render('authComplete', { error: req.authInfo.message || 'Authentication failed', appUrl });
    }
  } catch (err) {
    logger.error('Google callback error:', err);
    res.render('authComplete', { error: 'Server error', appUrl: process.env.APP_URL || 'http://localhost:3000' });
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