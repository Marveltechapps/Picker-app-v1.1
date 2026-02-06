/**
 * Run all seeds in dependency order.
 * Usage: npm run seed  (from backend folder)
 * Requires MongoDB running and MONGODB_URI in .env.
 */
require('../src/config/env');
const { connectDB } = require('../src/config/db');
const seedUsers = require('./seed-users');
const seedOtps = require('./seed-otps');
const seedShifts = require('./seed-shifts');
const seedFaqs = require('./seed-faqs');
const seedSamples = require('./seed-samples');
const seedDocuments = require('./seed-documents');
const seedBankAccounts = require('./seed-bank-accounts');
const seedWallets = require('./seed-wallets');
const seedTransactions = require('./seed-transactions');
const seedAttendance = require('./seed-attendance');
const seedNotifications = require('./seed-notifications');
const seedPushTokens = require('./seed-push-tokens');
const seedSupportTickets = require('./seed-support-tickets');

const User = require('../src/models/user.model');
const Otp = require('../src/models/otp.model');
const Shift = require('../src/models/shift.model');
const Faq = require('../src/models/faq.model');
const Sample = require('../src/models/sample.model');
const Document = require('../src/models/document.model');
const BankAccount = require('../src/models/bankAccount.model');
const Wallet = require('../src/models/wallet.model');
const Transaction = require('../src/models/transaction.model');
const Attendance = require('../src/models/attendance.model');
const Notification = require('../src/models/notification.model');
const PushToken = require('../src/models/pushToken.model');
const SupportTicket = require('../src/models/supportTicket.model');

const seeds = [
  { name: 'users', run: seedUsers.run, model: User },
  { name: 'otps', run: seedOtps.run, model: Otp },
  { name: 'shifts', run: seedShifts.run, model: Shift },
  { name: 'faqs', run: seedFaqs.run, model: Faq },
  { name: 'samples', run: seedSamples.run, model: Sample },
  { name: 'documents', run: seedDocuments.run, model: Document },
  { name: 'bank_accounts', run: seedBankAccounts.run, model: BankAccount },
  { name: 'wallets', run: seedWallets.run, model: Wallet },
  { name: 'transactions', run: seedTransactions.run, model: Transaction },
  { name: 'attendance', run: seedAttendance.run, model: Attendance },
  { name: 'notifications', run: seedNotifications.run, model: Notification },
  { name: 'push_tokens', run: seedPushTokens.run, model: PushToken },
  { name: 'support_tickets', run: seedSupportTickets.run, model: SupportTicket },
];

async function main() {
  await connectDB().catch((err) => {
    console.error('[seed] MongoDB not available:', err.message);
    process.exit(1);
  });
  for (const { name, run, model } of seeds) {
    try {
      await run();
      const count = await model.countDocuments();
      console.log(`Seeded: ${name} (${count})`);
    } catch (err) {
      console.error(`Seed failed (${name}):`, err.message);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
