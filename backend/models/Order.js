const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      trim: true,
      default: ''
    },
    tableNumber: {
      type: String,
      trim: true,
      default: ''
    },
    items: {
      type: [orderItemSchema],
      validate: [(value) => value.length > 0, 'Order must have at least one item']
    },
    subtotal: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'served', 'paid'],
      default: 'pending'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
