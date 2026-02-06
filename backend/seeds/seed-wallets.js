/**
 * Seed wallets collection. Idempotent: upsert by userId.
 * YAML: backend-workflow.yaml database.collections.wallets
 */
const Wallet = require('../src/models/wallet.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({}).limit(5);
  for (const user of users) {
    await Wallet.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          availableBalance: 2500,
          pendingBalance: 500,
          totalEarnings: 15000,
          currency: 'INR',
        },
      },
      { upsert: true }
    );
  }
}

module.exports = { run };
