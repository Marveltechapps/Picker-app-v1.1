/**
 * Seed attendance collection. Idempotent: insert 2-3 weeks of records per user if none.
 * YAML: backend-workflow.yaml database.collections.attendance
 */
const Attendance = require('../src/models/attendance.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'] } }).limit(5);
  if (users.length === 0) return;

  for (const user of users) {
    const count = await Attendance.countDocuments({ userId: user._id });
    if (count > 0) continue;

    const records = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
      const d = new Date(base);
      d.setDate(d.getDate() - dayOffset);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const punchIn = new Date(d);
      punchIn.setHours(9, 0, 0, 0);
      const punchOut = new Date(d);
      punchOut.setHours(18, 0, 0, 0);
      if (dayOffset % 3 === 1) punchOut.setHours(20, 0, 0, 0);

      const ordersCompleted = 45 + (dayOffset % 20);
      const hasOvertime = punchOut.getHours() >= 19;
      records.push({
        userId: user._id,
        punchIn,
        punchOut,
        shiftId: 's1',
        status: dayOffset % 5 === 2 ? 'half-day' : 'present',
        ordersCompleted,
        regularHours: hasOvertime ? 8 : 9,
        overtimeHours: hasOvertime ? 2 : 0,
      });
    }

    if (records.length > 0) {
      await Attendance.insertMany(records);
    }
  }
}

module.exports = { run };
