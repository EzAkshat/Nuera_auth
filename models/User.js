const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Removed required: true
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  googleId: { type: String, unique: true, sparse: true } // Added for Google OAuth
}, { timestamps: true });

// Generate a unique username based on a base name
userSchema.statics.generateUniqueUsername = async function (baseUsername) {
  let username = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  let count = 0;
  while (true) {
    const checkUsername = count === 0 ? username : `${username}${count}`;
    const existingUser = await this.findOne({ username: checkUsername });
    if (!existingUser) {
      return checkUsername;
    }
    count++;
  }
};

// Hash password before saving, if it exists and isn’t already hashed
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password && this.password.length !== 60) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password, handling cases where password is not set
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false; // No password set (e.g., Google users)
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);