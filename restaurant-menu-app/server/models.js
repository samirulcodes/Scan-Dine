const mongoose = require('mongoose');

// Define Order model
const orderSchema = new mongoose.Schema({
    tableNumber: Number,
    cart: Array,
    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;



// Explanation

// What It Does

// Imports Mongoose:
    // const mongoose = require('mongoose');
    // Brings in the Mongoose library to work with MongoDB.

// Defines a Schema:
    // A schema is like a blueprint for how data will be stored in the database.
    // This schema is for an "Order" and has the following fields:
        // tableNumber: A number representing the table where the order was placed.
        // cart: An array to store the food items that were ordered.
        // createdAt: The date and time when the order was created. It defaults to the current date and time if not provided.
// Creates the Model:
    // const Order = mongoose.model('Order', orderSchema);
    // Creates an "Order" model using the schema. The model lets you interact with the orders collection in the database (MongoDB automatically pluralizes the name).

// Exports the Model:
    // module.exports = Order;
    // Makes the Order model available to other files. You can now use this model to:
        // Add new orders to the database.
        // Fetch orders.
        // Update or delete orders.
