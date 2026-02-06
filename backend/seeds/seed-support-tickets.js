/**
 * Seed support_tickets collection. Idempotent: insert one per user if none.
 * YAML: backend-workflow.yaml database.collections.support_tickets
 */
const SupportTicket = require('../src/models/supportTicket.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'] } }).limit(5);
  const tickets = [
    { category: 'payout', subject: 'Withdrawal delay', message: 'My withdrawal from last week is still pending. Please look into it.', status: 'open' },
    { category: 'shift', subject: 'Shift swap request', message: 'I need to swap my morning shift for evening shift next week.', status: 'open' },
    { category: 'device', subject: 'HHD device issue', message: 'The handheld device is not scanning properly. Need replacement.', status: 'in_progress' },
    { category: 'attendance', subject: 'Punch-in failed', message: 'My punch-in did not register yesterday. Please correct my attendance.', status: 'open' },
    { category: 'other', subject: 'Training query', message: 'When will the new safety training videos be available?', status: 'resolved' },
  ];
  for (let i = 0; i < Math.min(users.length, 5); i++) {
    const count = await SupportTicket.countDocuments({ userId: users[i]._id });
    if (count > 0) continue;
    await SupportTicket.create({ userId: users[i]._id, ...tickets[i] });
  }
}

module.exports = { run };
