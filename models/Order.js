const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: String,
  contact: String,
  address: String,
  email: String, // for sending status update confirmation email
  items: [
    {
      id: String,
      title: String,
      price: Number,
      image: String,
      quantity: Number,
      category: String
    }
  ],
  total: Number,
  paymentMethod: String,
  status: {
    type: String,
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
