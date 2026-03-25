const express = require('express');
const { login, profile, register } = require('../controllers/authController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, authorize('admin'), register);
router.get('/profile', protect, profile);

module.exports = router;
