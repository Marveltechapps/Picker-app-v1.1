/**
 * Shift model – from backend-workflow.yaml (shifts collection).
 */
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    time: { type: String },
    duration: { type: String },
    orders: { type: Number },
    basePay: { type: Number },
    color: { type: String },
    locationType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);
