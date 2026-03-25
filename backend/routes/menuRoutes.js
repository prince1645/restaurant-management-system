const express = require('express');
const {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateMenuItem
} = require('../controllers/menuController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMenuItems);
router.post('/', protect, authorize('admin'), createMenuItem);
router.put('/:id', protect, authorize('admin'), updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;
