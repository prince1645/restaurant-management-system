const express = require('express');
const {
  createOrder,
  getDashboard,
  getOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getOrders);
router.post('/', protect, createOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.get('/dashboard/summary', protect, getDashboard);

module.exports = router;
