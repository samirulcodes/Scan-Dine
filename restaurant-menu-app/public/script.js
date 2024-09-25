
// let cart = [];
// let totalCost = 0;

// // Dummy menu items (could also fetch from backend)
// // const menuItems = [
// //     { id: 1, name: "Burger", price: 10 },
// //     { id: 2, name: "Pizza", price: 15 },
// //     { id: 3, name: "Pasta", price: 12 },
// // ];

// const menuItems = [
//     { id: 1, name: "Burger", price: 10, special: false },
//     { id: 2, name: "Pizza", price: 15, special: true }, // Special food item
//     { id: 3, name: "Pasta", price: 12, special: false },
//     { id: 4, name: "Steak", price: 25, special: true }, // Special food item
// ];



// // Generate QR Code
// function generateQRCode() {
//     const tableNumber = document.getElementById("tableNumber").value;
//     if (tableNumber) {
//         const url = `http://localhost:3000/menu.html?table=${tableNumber}`;
//         $('#qrCode').empty().qrcode(url);
//     } else {
//         alert("Please enter a valid table number.");
//     }
// }

// // function loadMenu() {
// //     const menuDiv = document.getElementById("menuItems");
// //     menuItems.forEach(item => {
// //         const div = document.createElement("div");
// //         div.innerHTML = `
// //             <h3>${item.name} - ₹${item.price}</h3>
// //             <button onclick="addToCart(${item.id})">Add to Cart</button>
// //         `;
// //         menuDiv.appendChild(div);
// //     });
// // }

// function loadMenu() {
//     const menuDiv = document.getElementById("menuItems");
//     const specialItems = menuItems.filter(item => item.special);
//     const regularItems = menuItems.filter(item => !item.special);

//     // Display special items first
//     if (specialItems.length > 0) {
//         const specialDiv = document.createElement("div");
//         specialDiv.innerHTML = "<h2>Our Special Food</h2>";
//         specialItems.forEach(item => {
//             const div = document.createElement("div");
//             div.innerHTML = `
//                 <h3 class="special">${item.name} - ₹${item.price}</h3>
//                 <button onclick="addToCart(${item.id})">Add to Cart</button>
//             `;
//             specialDiv.appendChild(div);
//         });
//         menuDiv.appendChild(specialDiv);
//     }

//     // Display regular items
//     if (regularItems.length > 0) {
//         const regularDiv = document.createElement("div");
//         regularDiv.innerHTML = "<h2>Menu</h2>";
//         regularItems.forEach(item => {
//             const div = document.createElement("div");
//             div.innerHTML = `
//                 <h3>${item.name} - ₹${item.price}</h3>
//                 <button onclick="addToCart(${item.id})">Add to Cart</button>
//             `;
//             regularDiv.appendChild(div);
//         });
//         menuDiv.appendChild(regularDiv);
//     }
// }





// function addToCart(id) {
//     const item = menuItems.find(i => i.id === id);
//     const existingItem = cart.find(i => i.id === id);

//     if (existingItem) {
//         // If the item already exists, increase the quantity
//         existingItem.quantity += 1;
//     } else {
//         // If the item doesn't exist, add it to the cart with quantity 1
//         cart.push({ ...item, quantity: 1 });
//     }
    
//     totalCost += item.price;
//     updateCart();
// }

// function removeFromCart(id) {
//     const index = cart.findIndex(i => i.id === id);
//     if (index > -1) {
//         totalCost -= cart[index].price * cart[index].quantity; // Remove total price for this item
//         cart.splice(index, 1);
//     }
//     updateCart();
// }

// function updateCart() {
//     const cartItemsList = document.getElementById("cartItems");
//     cartItemsList.innerHTML = "";
//     cart.forEach(item => {
//         const li = document.createElement("li");
//         li.innerHTML = `${item.name} - ₹${item.price} x ${item.quantity} <button onclick="removeFromCart(${item.id})">Remove</button>`;
//         cartItemsList.appendChild(li);
//     });
//     document.getElementById("totalCost").innerText = totalCost;
// }

// function placeOrder() {
//     const tableNumber = new URLSearchParams(window.location.search).get('table');

//     // Confirmation prompt before placing the order
//     const confirmation = confirm("Are you sure you want to place this order?");
//     if (!confirmation) {
//         alert("OOPS! Order not placed."); // Feedback if the user cancels
//         return; // Cancel order if the user does not confirm
//     }

//     fetch('/api/orders', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ tableNumber, cart }),
//     })
//     .then(response => response.json())
//     .then(data => {
//         alert('Order placed successfully!');
//         cart = [];
//         totalCost = 0;
//         updateCart();
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// }

// window.onload = loadMenu;












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
