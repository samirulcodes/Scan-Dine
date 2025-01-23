
let cart = [];
let totalCost = 0;

// Dummy menu items
const menuItems = [
    { id: 1, name: "Burger", price: 10, special: false },
    { id: 2, name: "Pizza", price: 15, special: true },
    { id: 3, name: "Pasta", price: 12, special: false },
    { id: 4, name: "Steak", price: 25, special: true },
];

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

function loadMenu() {
    const menuDiv = document.getElementById("menuItems");
    const specialItems = menuItems.filter(item => item.special);
    const regularItems = menuItems.filter(item => !item.special);

    // Display special items
    if (specialItems.length > 0) {
        const specialDiv = document.createElement("div");
        specialDiv.innerHTML = "<h2>Our Special Food</h2>";
        specialItems.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `
                <h3 class="special">${item.name} - ₹${item.price}</h3>
                <button onclick="addToCart(${item.id})">Add to Cart</button>
            `;
            specialDiv.appendChild(div);
        });
        menuDiv.appendChild(specialDiv);
    }

    // Display regular items
    if (regularItems.length > 0) {
        const regularDiv = document.createElement("div");
        regularDiv.innerHTML = "<h2>Menu</h2>";
        regularItems.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `
                <h3>${item.name} - ₹${item.price}</h3>
                <button onclick="addToCart(${item.id})">Add to Cart</button>
            `;
            regularDiv.appendChild(div);
        });
        menuDiv.appendChild(regularDiv);
    }
}

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
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
    const index = cart.findIndex(i => i.id === id);
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
        li.innerHTML = `${item.name} - ₹${item.price} x ${item.quantity} <button onclick="removeFromCart(${item.id})">Remove</button>`;
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
        alert('Order placed successfully!');
        updateOrderStatus();
        cart = [];
        totalCost = 0;
        updateCart();
    })
    .catch(error => console.error('Error:', error));
}

function updateOrderStatus() {
    const statusDiv = document.getElementById("orderStatus");

    statusDiv.innerText = "Food is preparing , wait for 10 minutes";
    
    setTimeout(() => {
        statusDiv.innerText = "Food is ready!";
    }, 100000);
}

// Search functionality
function searchFood() {
    const searchQuery = document.getElementById("foodSearch").value.toLowerCase();
    const filteredMenuItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery));

    const menuDiv = document.getElementById("menuItems");
    menuDiv.innerHTML = ""; // Clear current menu display

    if (filteredMenuItems.length > 0) {
        filteredMenuItems.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `
                <h3>${item.name} - ₹${item.price}</h3>
                <button onclick="addToCart(${item.id})">Add to Cart</button>
            `;
            menuDiv.appendChild(div);
        });
    } else {
        document.getElementById("searchResult").innerText = "Not available";
    }
}

window.onload = loadMenu;





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