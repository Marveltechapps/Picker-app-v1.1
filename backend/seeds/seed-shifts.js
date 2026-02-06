/**
 * Seed shifts collection. Idempotent: insert only if not present by id/name.
 * YAML: backend-workflow.yaml database.collections.shifts
 */
const Shift = require('../src/models/shift.model');

async function run() {
  const shifts = [
    { id: 's1', name: 'Morning', time: '6 AM - 2 PM', duration: '8h', orders: 50, basePay: 800, color: '#4CAF50', locationType: 'warehouse' },
    { id: 's2', name: 'Evening', time: '2 PM - 10 PM', duration: '8h', orders: 45, basePay: 850, color: '#2196F3', locationType: 'warehouse' },
    { id: 's3', name: 'Night', time: '10 PM - 6 AM', duration: '8h', orders: 30, basePay: 900, color: '#9C27B0', locationType: 'warehouse' },
    { id: 'd1', name: 'Darkstore AM', time: '8 AM - 4 PM', duration: '8h', orders: 60, basePay: 820, color: '#FF9800', locationType: 'darkstore' },
    { id: 'd2', name: 'Darkstore PM', time: '4 PM - 12 AM', duration: '8h', orders: 55, basePay: 840, color: '#795548', locationType: 'darkstore' },
  ];

  for (const s of shifts) {
    await Shift.findOneAndUpdate(
      { id: s.id },
      { $setOnInsert: s },
      { upsert: true }
    );
  }
}

module.exports = { run };
