/**
 * Seed users collection. Idempotent: upsert by phone.
 * YAML: backend-workflow.yaml database.collections.users
 */
const User = require('../src/models/user.model');

async function run() {
  const users = [
    { phone: '9876543210', name: 'Ramesh Kumar', email: 'ramesh@example.com', age: 28, gender: 'male', locationType: 'warehouse', trainingProgress: { video1: 100, video2: 100, video3: 50, video4: 0 }, selectedShifts: [{ id: 's1', name: 'Morning', time: '6 AM - 2 PM' }, { id: 's2', name: 'Evening', time: '2 PM - 10 PM' }], upiId: 'ramesh@paytm', upiName: 'Ramesh Kumar' },
    { phone: '8765432109', name: 'Priya Sharma', email: 'priya@example.com', age: 26, gender: 'female', locationType: 'darkstore', trainingProgress: { video1: 100, video2: 100, video3: 100, video4: 100 }, selectedShifts: [{ id: 's2', name: 'Evening', time: '2 PM - 10 PM' }] },
    { phone: '7654321098', name: 'Suresh Patel', email: 'suresh@example.com', age: 32, gender: 'male', locationType: 'warehouse', trainingProgress: { video1: 100, video2: 80, video3: 0, video4: 0 }, selectedShifts: [{ id: 's3', name: 'Night', time: '10 PM - 6 AM' }] },
    { phone: '6543210987', name: 'Lakshmi Devi', email: 'lakshmi@example.com', age: 24, gender: 'female', locationType: 'darkstore', trainingProgress: { video1: 100, video2: 100, video3: 100, video4: 50 }, selectedShifts: [{ id: 'd1', name: 'Darkstore AM', time: '8 AM - 4 PM' }] },
    { phone: '5432109876', name: 'Vijay Singh', email: 'vijay@example.com', age: 29, gender: 'male', locationType: 'warehouse', trainingProgress: { video1: 100, video2: 100, video3: 100, video4: 100 }, selectedShifts: [{ id: 's1', name: 'Morning', time: '6 AM - 2 PM' }, { id: 's3', name: 'Night', time: '10 PM - 6 AM' }], upiId: 'vijay@phonepe', upiName: 'Vijay Singh' },
  ];

  for (const u of users) {
    await User.findOneAndUpdate(
      { phone: u.phone },
      { $set: u },
      { upsert: true, new: true }
    );
  }
}

module.exports = { run };
