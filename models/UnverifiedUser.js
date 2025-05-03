const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const unverifiedUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true }
}, { timestamps: true });

unverifiedUserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password && this.password.length !== 60) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model('UnverifiedUser', unverifiedUserSchema);