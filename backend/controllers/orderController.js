const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const calculateBill = (items, gstRate) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const total = subtotal + gstAmount;
  return { subtotal, gstAmount, total };
};

exports.createOrder = async (req, res) => {
  try {
    const { customerName, tableNumber, items, gstRate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one menu item is required' });
    }

    const mappedItems = [];
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.menuItem)) {
        return res.status(400).json({ message: 'Invalid menu item id' });
      }
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) return res.status(404).json({ message: `Menu item ${item.menuItem} not found` });
      mappedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity || 1
      });
    }

    const taxRate = Number(gstRate ?? process.env.GST_RATE ?? 5);
    const { subtotal, gstAmount, total } = calculateBill(mappedItems, taxRate);

    const order = await Order.create({
      customerName,
      tableNumber,
      items: mappedItems,
      subtotal,
      gstRate: taxRate,
      gstAmount,
      total,
      createdBy: req.user._id
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('createdBy', 'name role');
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getDashboard = async (_req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({ createdAt: { $gte: startOfDay } });
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    const itemMap = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
      });
    });

    const popularItems = Object.entries(itemMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({
      totalOrdersToday: todayOrders.length,
      totalRevenue,
      popularItems
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
