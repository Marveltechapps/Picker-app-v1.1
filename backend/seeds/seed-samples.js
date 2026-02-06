/**
 * Seed samples collection. Idempotent: insert only if name not present.
 * YAML: backend-workflow.yaml database.collections.samples
 */
const Sample = require('../src/models/sample.model');

async function run() {
  const items = [
    { name: 'Demo Sample', description: 'Pre-seeded for testing' },
    { name: 'API Test Sample', description: 'Used by Postman tests' },
    { name: 'Sample 3', description: 'Third seed sample' },
    { name: 'Sample 4', description: 'Fourth seed sample' },
    { name: 'Sample 5', description: 'Fifth seed sample' },
  ];

  for (const item of items) {
    await Sample.findOneAndUpdate(
      { name: item.name },
      { $setOnInsert: item },
      { upsert: true }
    );
  }
}

module.exports = { run };
