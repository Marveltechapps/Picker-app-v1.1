/**
 * Training routes – from backend-workflow.yaml (training/progress GET, PUT).
 */
const express = require('express');
const trainingController = require('../controllers/training.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/progress', requireAuth, trainingController.getProgress);
router.put('/progress', requireAuth, trainingController.updateProgress);

module.exports = router;
