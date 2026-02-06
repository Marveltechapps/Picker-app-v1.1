/**
 * Seed documents collection. Idempotent: upsert by userId + docType + side.
 * YAML: backend-workflow.yaml database.collections.documents
 */
const Document = require('../src/models/document.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'] } }).limit(5);
  if (users.length === 0) return;

  const docs = [
    { userId: users[0]._id, docType: 'aadhar', side: 'front', url: 'https://example.com/docs/u1-aadhar-front.jpg' },
    { userId: users[0]._id, docType: 'aadhar', side: 'back', url: 'https://example.com/docs/u1-aadhar-back.jpg' },
    { userId: users[1]._id, docType: 'pan', side: 'front', url: 'https://example.com/docs/u2-pan-front.jpg' },
    { userId: users[1]._id, docType: 'pan', side: 'back', url: 'https://example.com/docs/u2-pan-back.jpg' },
    { userId: users[2]._id, docType: 'aadhar', side: 'front', url: 'https://example.com/docs/u3-aadhar-front.jpg' },
  ];

  for (const d of docs) {
    await Document.findOneAndUpdate(
      { userId: d.userId, docType: d.docType, side: d.side },
      { $set: d },
      { upsert: true }
    );
  }
}

module.exports = { run };
