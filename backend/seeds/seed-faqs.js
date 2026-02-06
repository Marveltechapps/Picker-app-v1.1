/**
 * Seed faqs collection. Idempotent: upsert by question.
 * YAML: backend-workflow.yaml database.collections.faqs
 */
const Faq = require('../src/models/faq.model');

async function run() {
  const faqs = [
    { category: 'Account', question: 'How do I update my phone number?', answer: 'Go to Profile > Personal Information > Edit. You may need to verify with OTP.', order: 1 },
    { category: 'Account', question: 'How do I change my bank account?', answer: 'Go to Payouts > Bank Details > Update Bank Details.', order: 2 },
    { category: 'Payouts', question: 'When will I receive my payout?', answer: 'Withdrawals are processed within 24-48 hours on working days.', order: 3 },
    { category: 'Payouts', question: 'Is there a minimum withdrawal amount?', answer: 'Minimum withdrawal is ₹100.', order: 4 },
    { category: 'Shifts', question: 'How do I select my shifts?', answer: 'After onboarding, go to Shift Selection and choose from available slots.', order: 5 },
  ];

  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await Faq.findOneAndUpdate(
      { question: f.question },
      { $set: { ...f, order: i + 1 } },
      { upsert: true }
    );
  }
}

module.exports = { run };
