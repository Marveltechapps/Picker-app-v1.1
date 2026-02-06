/**
 * Seed notifications collection. Idempotent: insert a few per user if none.
 * YAML: backend-workflow.yaml database.collections.notifications
 */
const Notification = require('../src/models/notification.model');
const User = require('../src/models/user.model');

async function run() {
  const user = await User.findOne({ phone: '9876543210' });
  if (!user) return;

  const count = await Notification.countDocuments({ userId: user._id });
  if (count > 0) return;

  await Notification.insertMany([
    { userId: user._id, type: 'payout', title: 'Payout processed', description: 'Your withdrawal of ₹500 has been completed.', isRead: false },
    { userId: user._id, type: 'shift', title: 'Shift reminder', description: 'Your morning shift starts at 6 AM tomorrow.', isRead: true },
    { userId: user._id, type: 'update', title: 'App update', description: 'A new version of the app is available.', isRead: false },
    { userId: user._id, type: 'milestone', title: '50 orders completed', description: 'Congratulations! You have completed 50 orders this week.', isRead: false },
    { userId: user._id, type: 'bonus', title: 'Weekly bonus credited', description: '₹200 bonus has been added to your wallet.', isRead: true },
  ]);
}

module.exports = { run };
