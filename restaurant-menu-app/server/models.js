const mongoose = require('mongoose');

// Define Order model
const orderSchema = new mongoose.Schema({
    tableNumber: Number,
    cart: Array,
    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
