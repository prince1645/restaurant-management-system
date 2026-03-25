const MenuItem = require('../models/MenuItem');

exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.create(req.body);
    return res.status(201).json(menuItem);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const query = {
      name: { $regex: search, $options: 'i' }
    };

    if (category) query.category = category;

    const menuItems = await MenuItem.find(query).sort({ createdAt: -1 });
    return res.json(menuItems);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
    return res.json(updatedItem);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Menu item not found' });
    return res.json({ message: 'Menu item removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
