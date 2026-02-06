/**
 * Attendance model – from backend-workflow.yaml (attendance collection).
 */
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    punchIn: { type: Date, required: true },
    punchOut: { type: Date },
    locationIn: { type: mongoose.Schema.Types.Mixed },
    locationOut: { type: mongoose.Schema.Types.Mixed },
    shiftId: { type: String },
    status: { type: String, enum: ['present', 'half-day', 'absent'] },
    ordersCompleted: { type: Number },
    regularHours: { type: Number },
    overtimeHours: { type: Number },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, punchIn: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
