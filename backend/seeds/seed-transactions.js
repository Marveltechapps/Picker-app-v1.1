/**
 * Seed transactions collection. Idempotent: insert multiple credit/debit records per user if none.
 * YAML: backend-workflow.yaml database.collections.transactions
 */
const Transaction = require('../src/models/transaction.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109'] } }).limit(2);
  for (const user of users) {
    const count = await Transaction.countDocuments({ userId: user._id });
    if (count > 0) continue;

    const base = new Date();
    base.setDate(base.getDate() - 30);
    const txs = [
      { userId: user._id, type: 'credit', amount: 1200, status: 'completed', description: 'Shift earnings', referenceId: `ref-${user._id}-1`, completedAt: base, createdAt: base },
      { userId: user._id, type: 'credit', amount: 800, status: 'completed', description: 'Bonus', referenceId: `ref-${user._id}-2`, completedAt: new Date(base.getTime() + 86400000), createdAt: new Date(base.getTime() + 86400000) },
      { userId: user._id, type: 'debit', amount: 500, status: 'completed', description: 'Withdrawal', referenceId: `ref-${user._id}-3`, completedAt: new Date(base.getTime() + 2 * 86400000), createdAt: new Date(base.getTime() + 2 * 86400000), metadata: { paymentMode: 'Bank Transfer' } },
      { userId: user._id, type: 'credit', amount: 1500, status: 'completed', description: 'Overtime pay', referenceId: `ref-${user._id}-4`, completedAt: new Date(base.getTime() + 3 * 86400000), createdAt: new Date(base.getTime() + 3 * 86400000) },
      { userId: user._id, type: 'debit', amount: 300, status: 'completed', description: 'Withdrawal', referenceId: `ref-${user._id}-5`, completedAt: new Date(base.getTime() + 4 * 86400000), createdAt: new Date(base.getTime() + 4 * 86400000), metadata: { paymentMode: 'Bank Transfer' } },
      { userId: user._id, type: 'debit', amount: 1000, status: 'completed', description: 'Withdrawal', referenceId: `ref-${user._id}-6`, completedAt: new Date(base.getTime() + 7 * 86400000), createdAt: new Date(base.getTime() + 7 * 86400000), metadata: { paymentMode: 'Bank Transfer' } },
      { userId: user._id, type: 'credit', amount: 2200, status: 'completed', description: 'Monthly payout', referenceId: `ref-${user._id}-7`, completedAt: new Date(base.getTime() + 10 * 86400000), createdAt: new Date(base.getTime() + 10 * 86400000) },
      { userId: user._id, type: 'debit', amount: 750, status: 'completed', description: 'Withdrawal', referenceId: `ref-${user._id}-8`, completedAt: new Date(base.getTime() + 14 * 86400000), createdAt: new Date(base.getTime() + 14 * 86400000), metadata: { paymentMode: 'Bank Transfer' } },
    ];
    await Transaction.insertMany(txs);
  }
}

module.exports = { run };
