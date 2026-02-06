/**
 * Verify seed data: connect to DB and log document counts for each seeded collection.
 * Usage: node seeds/check-seeds.js  (from backend folder)
 * Requires MongoDB running and MONGODB_URI in .env.
 */
require('../src/config/env');
const { connectDB } = require('../src/config/db');
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

const collections = [
  { name: 'users', model: User },
  { name: 'otps', model: Otp },
  { name: 'shifts', model: Shift },
  { name: 'faqs', model: Faq },
  { name: 'samples', model: Sample },
  { name: 'documents', model: Document },
  { name: 'bank_accounts', model: BankAccount },
  { name: 'wallets', model: Wallet },
  { name: 'transactions', model: Transaction },
  { name: 'attendance', model: Attendance },
  { name: 'notifications', model: Notification },
  { name: 'push_tokens', model: PushToken },
  { name: 'support_tickets', model: SupportTicket },
];

async function main() {
  await connectDB().catch((err) => {
    console.error('[check-seeds] MongoDB not available:', err.message);
    process.exit(1);
  });
  console.log('[check-seeds] Collection counts:');
  let allNonZero = true;
  for (const { name, model } of collections) {
    const count = await model.countDocuments();
    if (count === 0) allNonZero = false;
    console.log(`  ${name}: ${count}`);
  }
  process.exit(allNonZero ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
