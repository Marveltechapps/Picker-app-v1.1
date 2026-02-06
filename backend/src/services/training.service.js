/**
 * Training service – from backend-workflow.yaml (training_progress_upsert, training_progress_get).
 * REAL-TIME: default zeros if DB slow; never block.
 */
const User = require('../models/user.model');
const { withTimeout, DB_TIMEOUT_MS } = require('../utils/realtime.util');

const defaultProgress = { video1: 0, video2: 0, video3: 0, video4: 0 };

const getProgress = async (userId) => {
  try {
    const user = await withTimeout(
      User.findById(userId).select('trainingProgress').lean(),
      DB_TIMEOUT_MS,
      null
    );
    if (!user || !user.trainingProgress) return defaultProgress;
    return {
      video1: user.trainingProgress.video1 ?? 0,
      video2: user.trainingProgress.video2 ?? 0,
      video3: user.trainingProgress.video3 ?? 0,
      video4: user.trainingProgress.video4 ?? 0,
    };
  } catch (err) {
    console.warn('[training] getProgress fallback:', err?.message);
    return defaultProgress;
  }
};

const updateProgress = async (userId, body) => {
  const update = {};
  if (typeof body?.video1 === 'number') update['trainingProgress.video1'] = Math.min(100, Math.max(0, body.video1));
  if (typeof body?.video2 === 'number') update['trainingProgress.video2'] = Math.min(100, Math.max(0, body.video2));
  if (typeof body?.video3 === 'number') update['trainingProgress.video3'] = Math.min(100, Math.max(0, body.video3));
  if (typeof body?.video4 === 'number') update['trainingProgress.video4'] = Math.min(100, Math.max(0, body.video4));
  if (Object.keys(update).length === 0) return getProgress(userId);
  try {
    await withTimeout(User.findByIdAndUpdate(userId, { $set: update }), DB_TIMEOUT_MS);
  } catch (err) {
    console.warn('[training] updateProgress fallback:', err?.message);
  }
  return getProgress(userId);
};

module.exports = { getProgress, updateProgress };
