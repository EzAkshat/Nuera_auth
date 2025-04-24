const mongoose = require('mongoose');

const tempCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('TempCode', tempCodeSchema);