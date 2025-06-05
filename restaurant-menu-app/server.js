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
// Delete an order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API to get sales data
app.get('/api/sales', async (req, res) => {
    try {
        const { period, year, month } = req.query;
        let startDate;
        let endDate = new Date();

        if (year) {
            const parsedYear = parseInt(year);
            if (isNaN(parsedYear)) {
                return res.status(400).json({ message: 'Invalid year specified' });
            }

            if (month) {
                const parsedMonth = parseInt(month) - 1; // Month is 0-indexed in JavaScript Date
                if (isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
                    return res.status(400).json({ message: 'Invalid month specified' });
                }
                startDate = new Date(parsedYear, parsedMonth, 1);
                endDate = new Date(parsedYear, parsedMonth + 1, 0); // Last day of the month
                endDate.setHours(23, 59, 59, 999); // Set to end of day
            } else {
                // Total sales for the year
                startDate = new Date(parsedYear, 0, 1);
                endDate = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
            }
        } else {
            switch (period) {
                case 'week':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
                    break;
                case 'year':
                    startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period or missing year/month specified' });
            }
        }

        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $unwind: '$cart' },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalSales: { $sum: { $multiply: ['$cart.price', '$cart.quantity'] } } } },
            { $sort: { _id: 1 } }
        ]);

        res.json(salesData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API to get most ordered items
app.get('/api/top-items', async (req, res) => {
    try {
        const { period, year, month } = req.query;
        let startDate;
        let endDate = new Date();

        if (year) {
            const parsedYear = parseInt(year);
            if (isNaN(parsedYear)) {
                return res.status(400).json({ message: 'Invalid year specified' });
            }

            if (month) {
                const parsedMonth = parseInt(month) - 1; // Month is 0-indexed in JavaScript Date
                if (isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
                    return res.status(400).json({ message: 'Invalid month specified' });
                }
                startDate = new Date(parsedYear, parsedMonth, 1);
                endDate = new Date(parsedYear, parsedMonth + 1, 0); // Last day of the month
                endDate.setHours(23, 59, 59, 999); // Set to end of day
            } else {
                // Total sales for the year
                startDate = new Date(parsedYear, 0, 1);
                endDate = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
            }
        } else {
            switch (period) {
                case 'week':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
                    break;
                case 'year':
                    startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period or missing year/month specified' });
            }
        }

        const topItems = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $unwind: '$cart' },
            { $group: { _id: '$cart.name', count: { $sum: '$cart.quantity' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json(topItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start the server
// Admin Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Replace with your actual secure authentication logic (e.g., database lookup, hashed passwords)
    if (username === 'admin' && password === 'admin123') { // Use strong, hashed passwords in production
        res.json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});