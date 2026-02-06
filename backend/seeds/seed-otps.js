/**
 * Seed otps collection. Idempotent: upsert by phone; expires in 10 min.
 * YAML: backend-workflow.yaml database.collections.otps
 */
const Otp = require('../src/models/otp.model');

async function run() {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otps = [
    { phone: '9876543210', code: '1234' },
    { phone: '8765432109', code: '5678' },
    { phone: '7654321098', code: '9012' },
    { phone: '6543210987', code: '3456' },
    { phone: '5432109876', code: '7890' },
  ];
  for (const o of otps) {
    await Otp.findOneAndUpdate(
      { phone: o.phone },
      { phone: o.phone, code: o.code, expiresAt },
      { upsert: true }
    );
  }
}

module.exports = { run };
