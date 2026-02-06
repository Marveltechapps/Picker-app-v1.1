/**
 * Seed push_tokens collection. Idempotent: upsert by token or (userId + deviceId).
 * YAML: backend-workflow.yaml database.collections.push_tokens
 */
const PushToken = require('../src/models/pushToken.model');
const User = require('../src/models/user.model');

async function run() {
  const users = await User.find({ phone: { $in: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'] } }).limit(5);
  const tokens = [
    { deviceId: 'seed-device-001', platform: 'android', token: 'ExponentPushToken[seed-token-1]' },
    { deviceId: 'seed-device-002', platform: 'ios', token: 'ExponentPushToken[seed-token-2]' },
    { deviceId: 'seed-device-003', platform: 'android', token: 'ExponentPushToken[seed-token-3]' },
    { deviceId: 'seed-device-004', platform: 'android', token: 'ExponentPushToken[seed-token-4]' },
    { deviceId: 'seed-device-005', platform: 'ios', token: 'ExponentPushToken[seed-token-5]' },
  ];
  for (let i = 0; i < Math.min(users.length, 5); i++) {
    const t = tokens[i];
    await PushToken.findOneAndUpdate(
      { deviceId: t.deviceId },
      { $set: { userId: users[i]._id.toString(), token: t.token, platform: t.platform, deviceId: t.deviceId } },
      { upsert: true }
    );
  }
}

module.exports = { run };
