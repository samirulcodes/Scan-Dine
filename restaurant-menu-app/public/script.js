
let cart = [];
let totalCost = 0;
let menuItems = []; // This will now be populated from the API

// Generate QR Code
function generateQRCode() {
    const tableNumber = document.getElementById("tableNumber").value;
    if (tableNumber) {
        const url = `http://localhost:3000/menu.html?table=${tableNumber}`;
        $('#qrCode').empty().qrcode(url);
    } else {
        alert("Please enter a valid table number.");
    }
}

async function loadMenu() {
    try {
        const response = await fetch('/api/menu-items');
        menuItems = await response.json();
        displayMenu(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

function displayMenu(itemsToDisplay) {
    const menuDiv = document.getElementById("menuItems");
    menuDiv.innerHTML = ""; // Clear current menu display

    const specialItems = itemsToDisplay.filter(item => item.special);
    const regularItems = itemsToDisplay.filter(item => !item.special);

    // Display special items
    if (specialItems.length > 0) {
        const specialDiv = document.createElement("div");
        specialDiv.innerHTML = "<h2>Our Special Food</h2>";
        specialItems.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `
                <h3 class="special">${item.name} - ₹${item.price}</h3>
                <p>${item.description}</p>
                <button onclick="addToCart('${item._id}')">Add to Cart</button>
            `;
            menuDiv.appendChild(div);
        });
    }

    // Display regular items
    if (regularItems.length > 0) {
        const regularDiv = document.createElement("div");
        regularDiv.innerHTML = "<h2>Menu</h2>";
        regularItems.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `
                <h3>${item.name} - ₹${item.price}</h3>
                <p>${item.description}</p>
                <button onclick="addToCart('${item._id}')">Add to Cart</button>
            `;
            menuDiv.appendChild(div);
        });
    }
}

function addToCart(id) {
    const item = menuItems.find(i => i._id === id);
    const existingItem = cart.find(i => i.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    totalCost += item.price;
    updateCart();
}

function removeFromCart(id) {
    const index = cart.findIndex(i => i._id === id);
    if (index > -1) {
        totalCost -= cart[index].price * cart[index].quantity;
        cart.splice(index, 1);
    }
    updateCart();
}

function updateCart() {
    const cartItemsList = document.getElementById("cartItems");
    cartItemsList.innerHTML = "";
    cart.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `${item.name} - ₹${item.price} x ${item.quantity} <button onclick="removeFromCart('${item._id}')">Remove</button>`;
        cartItemsList.appendChild(li);
    });
    document.getElementById("totalCost").innerText = totalCost;
}

function placeOrder() {

    // Check if cart is empty
    if (cart.length === 0) {
        alert("No food selected. Please add food to the cart before placing an order.");
        return; // Prevent further execution if no food is selected
    }

    const tableNumber = new URLSearchParams(window.location.search).get('table');
    const confirmation = confirm("Are you sure you want to place this order?");
    if (!confirmation) {
        alert("Order not placed.");
        return;
    }

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, cart }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.order && data.order._id) {
            localStorage.setItem('lastOrderId', data.order._id);
            document.getElementById('orderStatus').textContent = 'Order Placed Successfully';
            // Introduce a small delay before fetching the actual status
            setTimeout(() => {
                updateOrderStatus(data.order._id);
            }, 5000); // 5-second delay

            // Clear cart after successful order
            cart = [];
            updateCart();
            saveCart();

            alert('Order placed successfully!');
        } else {
            alert('Failed to place order.');
        }
    })
    .catch(error => console.error('Error:', error));
}

let orderStatusInterval;

async function updateOrderStatus(orderId) {
    const statusDiv = document.getElementById("orderStatus");
    if (!orderId) {
        statusDiv.innerText = "No active order.";
        return;
    }

    try {
        console.log('Fetching order status for orderId:', orderId);
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();
        if (order) {
            statusDiv.innerText = `Order Status: ${order.status}`;
            // Set up polling to continuously update status
            if (orderId) {
                if (orderStatusInterval) {
                    clearInterval(orderStatusInterval);
                }
                orderStatusInterval = setInterval(() => updateOrderStatus(orderId), 5000); // Poll every 5 seconds
            }
        } else {
            statusDiv.innerText = "Order not found.";
        }
    } catch (error) {
        console.error('Error fetching order status:', error);
        statusDiv.innerText = "Error fetching order status.";
    }
}

// Search functionality
function searchFood() {
    const searchQuery = document.getElementById("foodSearch").value.toLowerCase();
    const filteredMenuItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery) || item.category.toLowerCase().includes(searchQuery));
    displayMenu(filteredMenuItems);
    if (filteredMenuItems.length === 0) {
        document.getElementById("searchResult").innerText = "No items found.";
    } else {
        document.getElementById("searchResult").innerText = "";
    }
}

window.onload = () => {
    loadMenu();
    const lastOrderId = localStorage.getItem('lastOrderId');
    console.log('lastOrderId from localStorage:', lastOrderId);
    if (lastOrderId) {
        updateOrderStatus(lastOrderId);
    }
};





// Explanation

// Data and Variables
// cart and totalCost:

// cart: An array to store the items that users add to their cart.
// totalCost: A number to keep track of the total price of all items in the cart.

// menuItems:
// A dummy menu with some food items. Each item has an id, name, price, and a special flag to indicate if it's a special dish.

// Functions
// 1. Generate QR Code
// generateQRCode():
// Takes a table number entered by the user.
// Creates a URL with the table number as a query parameter (e.g., http://localhost:3000/menu.html?table=1).
// Generates a QR code for that URL.

// 2. Load and Display Menu
// loadMenu():
// Divides menu items into special and regular items.
// Dynamically displays them on the webpage with "Add to Cart" buttons.

// 3. Add and Remove Items from Cart
// addToCart(id):
// Adds a selected food item to the cart. If it's already in the cart, it increases the quantity.
// Updates the total cost.

// removeFromCart(id):

// Removes a selected item from the cart.
// Reduces the total cost accordingly.

// updateCart():
// Refreshes the cart display (shows items, quantities, and a remove button).
// Updates the total cost on the screen.

// 4. Place an Order
// placeOrder():
// Ensures the cart is not empty before placing the order.
// Confirms the order with the user.
// Sends the order details (table number and cart items) to a server endpoint (/api/orders).
// Clears the cart and resets the total cost after the order is placed.
// Updates the order status on the screen (e.g., "Food is preparing").

// 5. Update Order Status
// updateOrderStatus():
// Displays "Food is preparing" after the order is placed.
// Changes the status to "Food is ready!" after 10 minutes.

// 6. Search Functionality
// searchFood():
// Filters the menu items based on the user's search input.
// Displays the matching items or shows "Not available" if no matches are found.

// How It All Comes Together
// When the webpage loads, the loadMenu() function displays the menu items.
// Users can:
    // Add items to the cart.
    // View or remove items from the cart.
    // Search for specific items.

// Users can place an order after confirming the cart.
// The app sends the order to the server and displays the preparation status.
// A QR code can be generated to access the menu from a table-specific link.