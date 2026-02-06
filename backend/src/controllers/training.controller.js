/**
 * Training controller – from backend-workflow.yaml (training_progress_upsert, training_progress_get).
 */
const trainingService = require('../services/training.service');
const { success } = require('../utils/response.util');

const getProgress = async (req, res, next) => {
  try {
    const data = await trainingService.getProgress(req.userId);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const data = await trainingService.updateProgress(req.userId, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgress, updateProgress };
