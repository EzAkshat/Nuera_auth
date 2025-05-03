const express = require('express');
const router = express.Router();
const path = require('path');
const authController = require('../controllers/authController');
const passport = require('passport');
const crypto = require('crypto');
const TempCode = require('../models/TempCode');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
router.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
router.get('/verify-otp', (req, res) => res.sendFile(path.join(__dirname, '../public/verifyOtp.html')));
router.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, '../public/forgotPassword.html')));
router.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, '../public/resetPassword.html')));

router.post('/login', authController.postLogin);
router.post('/register', authController.postRegister);
router.post('/verify-otp', authController.postVerifyOtp);
router.post('/forgot-password', authController.postForgotPassword);
router.post('/reset-password', authController.postResetPassword);
router.post('/resend-otp', authController.postResendOtp);
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/web', (req, res, next) => {
  req.session.from = 'web';
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/auth/google/callback', passport.authenticate('google'), authController.googleCallback);
router.post('/token', authController.exchangeToken);

module.exports = router;