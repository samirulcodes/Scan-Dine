require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_db';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());



// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
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

const { Order, MenuItem, Feedback } = require('./server/models');

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
        console.error('Error deleting feedback:', error);
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
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: error.message });
    }
});

// API endpoints for Menu Items

// Add a new menu item
app.post('/api/menu-items', async (req, res) => {
    try {
        const { name, description, price, category, available } = req.body;
        const newItem = new MenuItem({ name, description, price, category, available });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all menu items
app.get('/api/menu-items', async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE endpoint to delete feedback
app.delete('/api/feedback/:id', async (req, res) => {
    console.log(`Attempting to delete feedback with ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const deletedFeedback = await Feedback.findByIdAndDelete(id);
        if (!deletedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a single menu item by ID
app.get('/api/menu-items/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a menu item
app.put('/api/menu-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a menu item
// Update menu item availability
app.put('/api/menu-items/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { available } = req.body;
        const updatedItem = await MenuItem.findByIdAndUpdate(id, { available }, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a menu item
app.delete('/api/menu-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await MenuItem.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
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
        console.error('Error deleting feedback:', error);
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

// API endpoint to save feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const { dishName, rating, comment, customerName } = req.body;
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required.' });
        }
        const newFeedback = new Feedback({ dishName, rating, comment, customerName });
        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
});

// API endpoint to get all feedback
app.get('/api/feedback', async (req, res) => {
    try {
        const feedback = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});