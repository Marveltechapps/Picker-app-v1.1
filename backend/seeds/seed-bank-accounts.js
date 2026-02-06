/**
 * Seed bank_accounts collection. Idempotent: insert if no account for user with same last4.
 * YAML: backend-workflow.yaml database.collections.bank_accounts
 */
const BankAccount = require('../src/models/bankAccount.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'] } }).limit(5);
  const accounts = [
    { accountHolder: 'Ramesh Kumar', accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC Bank', branch: 'Chennai Main' },
    { accountHolder: 'Priya Sharma', accountNumber: '234567890123', ifscCode: 'ICIC0005678', bankName: 'ICICI Bank', branch: 'Mumbai Central' },
    { accountHolder: 'Suresh Patel', accountNumber: '345678901234', ifscCode: 'SBIN0009012', bankName: 'SBI', branch: 'Ahmedabad' },
    { accountHolder: 'Lakshmi Devi', accountNumber: '456789012345', ifscCode: 'AXIS0003456', bankName: 'Axis Bank', branch: 'Bangalore' },
    { accountHolder: 'Vijay Singh', accountNumber: '567890123456', ifscCode: 'KOTAK0007890', bankName: 'Kotak Bank', branch: 'Delhi' },
  ];
  for (let i = 0; i < Math.min(users.length, 5); i++) {
    const user = users[i];
    const existing = await BankAccount.findOne({ userId: user._id });
    if (existing) continue;
    const acc = accounts[i];
    await BankAccount.create({
      userId: user._id,
      accountHolder: acc.accountHolder,
      accountNumber: acc.accountNumber,
      ifscCode: acc.ifscCode,
      bankName: acc.bankName,
      branch: acc.branch,
      isVerified: true,
      isDefault: true,
    });
  }
}

module.exports = { run };
