/**
 * User model – from frontend YAML (application-spec / backend-workflow).
 * Fields: phone, email, name, age, gender, photoUri, locationType, selectedShifts, trainingProgress, upiId, upiName.
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female'] },
    photoUri: { type: String },
    locationType: { type: String, enum: ['warehouse', 'darkstore'] },
    selectedShifts: [{ id: String, name: String, time: String }],
    trainingProgress: {
      video1: { type: Number, default: 0 },
      video2: { type: Number, default: 0 },
      video3: { type: Number, default: 0 },
      video4: { type: Number, default: 0 },
    },
    upiId: { type: String },
    upiName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
