const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/restaurant_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Order Schema
const orderSchema = new mongoose.Schema({
    tableNumber: { type: String, required: true },
    cart: [{
        name: String,
        price: Number,
        quantity: Number
    }],
    status: { type: String, default: 'Preparing' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// API endpoint to save new order
app.post('/api/orders', async (req, res) => {
    try {
        const { tableNumber, cart } = req.body;
        if (!tableNumber || !cart) {
            return res.status(400).json({ message: 'Table number and cart are required.' });
        }
        
        const newOrder = new Order({ tableNumber, cart });
        await newOrder.save();
        res.json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Failed to save order' });
    }
});

// API endpoint to get orders by date
app.get('/api/orders', async (req, res) => {
    try {
        const date = req.query.date;
        let orders;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            orders = await Order.find({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            }).sort({ createdAt: -1 });
        } else {
            orders = await Order.find().sort({ createdAt: -1 });
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// API endpoint to get a single order by ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching single order:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
});

// PUT endpoint to update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// DELETE endpoint to delete an order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).send('Order not found');
        }
        res.status(200).send('Order deleted successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});