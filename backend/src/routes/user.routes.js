/**
 * User routes – from backend-workflow.yaml (users/profile, users/location-type, users/upi).
 */
const express = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.put('/location-type', requireAuth, userController.setLocationType);
router.put('/upi', requireAuth, userController.setUpi);

module.exports = router;
