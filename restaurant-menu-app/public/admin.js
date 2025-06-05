document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('orderDate').value = `${yyyy}-${mm}-${dd}`;
    fetchOrders();
    fetchMenuItems(); // Fetch menu items on page load

    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('isAuthenticated');
        window.location.href = 'login.html';
    });

    const salesPeriodSelect = document.getElementById('sales-period');
    const salesYearInput = document.getElementById('sales-year');
    const salesMonthInput = document.getElementById('sales-month');

    salesPeriodSelect.addEventListener('change', () => {
        if (salesPeriodSelect.value === 'custom') {
            salesYearInput.style.display = 'inline-block';
            salesMonthInput.style.display = 'inline-block';
        } else {
            salesYearInput.style.display = 'none';
            salesMonthInput.style.display = 'none';
        }
    });

    document.getElementById('fetch-sales-btn').addEventListener('click', fetchSalesData);
});

async function fetchSalesData() {
    const salesPeriod = document.getElementById('sales-period').value;
    const salesYear = document.getElementById('sales-year').value;
    const salesMonth = document.getElementById('sales-month').value;
    const salesDataContainer = document.getElementById('sales-data');
    const topItemsDataContainer = document.getElementById('top-items-data');

    salesDataContainer.innerHTML = 'Loading sales data...';
    topItemsDataContainer.innerHTML = 'Loading top items data...';

    try {
        let salesUrl = `/api/sales?period=${salesPeriod}`;
        if (salesPeriod === 'custom') {
            if (salesYear) salesUrl += `&year=${salesYear}`;
            if (salesMonth) salesUrl += `&month=${salesMonth}`;
        }

        const salesResponse = await fetch(salesUrl);
        const sales = await salesResponse.json();
        displaySalesData(sales);

        let topItemsUrl = `/api/top-items?period=${salesPeriod}`;
        if (salesPeriod === 'custom') {
            if (salesYear) topItemsUrl += `&year=${salesYear}`;
            if (salesMonth) topItemsUrl += `&month=${salesMonth}`;
        }

        const topItemsResponse = await fetch(topItemsUrl);
        const topItems = await topItemsResponse.json();
        displayTopItems(topItems);

    } catch (error) {
        console.error('Error fetching sales data:', error);
        salesDataContainer.innerHTML = 'Failed to load sales data.';
        topItemsDataContainer.innerHTML = 'Failed to load top items data.';
    }
}

function displaySalesData(sales) {
    const salesDataContainer = document.getElementById('sales-data');
    salesDataContainer.innerHTML = '';

    if (sales.length === 0) {
        salesDataContainer.innerHTML = '<p>No sales data available for this period.</p>';
        return;
    }

    const ul = document.createElement('ul');
    sales.forEach(sale => {
        const li = document.createElement('li');
        li.innerHTML = `<span>Date: ${new Date(sale._id).toLocaleDateString()}</span> <span>Total Sales: $${sale.totalSales.toFixed(2)}</span>`;
        ul.appendChild(li);
    });
    salesDataContainer.appendChild(ul);
}

function displayTopItems(topItems) {
    const topItemsDataContainer = document.getElementById('top-items-data');
    topItemsDataContainer.innerHTML = '';

    if (topItems.length === 0) {
        topItemsDataContainer.innerHTML = '<p>No top items data available for this period.</p>';
        return;
    }

    const ul = document.createElement('ul');
    topItems.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item._id}</span> <span>Ordered: ${item.count} times</span>`;
        ul.appendChild(li);
    });
    topItemsDataContainer.appendChild(ul);
}

async function fetchOrders() {
    const orderDate = document.getElementById('orderDate').value;
    const ordersList = document.getElementById('orders-container');
    ordersList.innerHTML = 'Loading orders...';

    try {
        const response = await fetch(`/api/orders?date=${orderDate}`);
        const orders = await response.json();

        ordersList.innerHTML = ''; // Clear loading message

        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders found for this date.</p>';
            return;
        }

        orders.forEach(order => {
            console.log(`Order ID: ${order._id}, Status from fetchOrders: ${order.status}`);
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-card';
            orderDiv.innerHTML = `
                <h3>Order for Table: ${order.tableNumber}</h3>
                <p>Status: ${order.status}</p>
                <p>Ordered At: ${new Date(order.createdAt).toLocaleString()}</p>
                <h4>Items:</h4>
                <ul>
                    ${order.cart.map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price}</li>`).join('')}
                </ul>
                <div class="order-actions">
                    <select class="order-status-select" data-order-id="${order._id}">
                        <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <button class="delete-order-btn" data-order-id="${order._id}">Delete</button>
                </div>
            `;
            ordersList.appendChild(orderDiv);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-order-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const orderId = event.target.dataset.orderId;
                if (confirm('Are you sure you want to delete this order?')) {
                    try {
                        const response = await fetch(`/api/orders/${orderId}`, {
                            method: 'DELETE',
                        });
                        if (response.ok) {
                            alert('Order deleted successfully!');
                            fetchOrders(); // Refresh the order list
                        } else {
                            alert('Failed to delete order.');
                        }
                    } catch (error) {
                        console.error('Error deleting order:', error);
                        alert('Error deleting order.');
                    }
                }
            });
        });

        // Add event listeners for status dropdowns
        document.querySelectorAll('.order-status-select').forEach(selectElement => {
            selectElement.addEventListener('change', async (event) => {
                const orderId = event.target.dataset.orderId;
                const newStatus = event.target.value;
                await updateOrderStatus(orderId, newStatus);
            });
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        ordersList.innerHTML = '<p>Error loading orders.</p>';
    }
}


async function updateOrderStatus(orderId, newStatus) {
    try {
        console.log(`Attempting to update order ${orderId} to status: ${newStatus}`);
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            console.log(`Order ${orderId} status updated to ${newStatus}`);
            console.log('Calling fetchOrders() to refresh the list.');
            // Optionally, re-fetch orders to update the display
            fetchOrders(); 
        } else {
            console.error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

// Menu Management Functions

document.getElementById('addMenuItemBtn').addEventListener('click', () => {
    // Implement logic to show a form for adding a new menu item
    // For now, let's just log a message
    console.log('Add New Menu Item button clicked');
    showMenuItemForm();
});

async function fetchMenuItems() {
    const menuItemsContainer = document.getElementById('menu-items-container');
    menuItemsContainer.innerHTML = 'Loading menu items...';
    try {
        const response = await fetch('/api/menu-items');
        const items = await response.json();
        displayMenuItems(items);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        menuItemsContainer.innerHTML = '<p>Error loading menu items.</p>';
    }
}

function displayMenuItems(items) {
    const menuItemsContainer = document.getElementById('menu-items-container');
    menuItemsContainer.innerHTML = '';

    if (items.length === 0) {
        menuItemsContainer.innerHTML = '<p>No menu items available.</p>';
        return;
    }

    const ul = document.createElement('ul');
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'menu-item-card';
        li.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>Price: $${item.price.toFixed(2)}</p>
            <p>Category: ${item.category}</p>
            <div class="menu-item-availability">
                <input type="checkbox" id="item-available-${item._id}" class="item-available-checkbox" data-id="${item._id}" ${item.available ? 'checked' : ''}>
                <label for="item-available-${item._id}">Available</label>
            </div>
            <div class="menu-item-actions">
                <button onclick="editMenuItem('${item._id}')">Edit</button>
                <button onclick="deleteMenuItem('${item._id}')">Delete</button>
            </div>
        `;
        ul.appendChild(li);
    });
    menuItemsContainer.appendChild(ul);

    // Add event listeners for availability checkboxes
    document.querySelectorAll('.item-available-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (event) => {
            const itemId = event.target.dataset.id;
            const isAvailable = event.target.checked;
            await updateMenuItemAvailability(itemId, isAvailable);
        });
    });
}

async function updateMenuItemAvailability(itemId, isAvailable) {
    try {
        const response = await fetch(`/api/menu-items/${itemId}/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ available: isAvailable }),
        });

        if (response.ok) {
            console.log(`Menu item ${itemId} availability updated to ${isAvailable}`);
            // Optionally, refresh menu items to reflect changes, or update UI directly
            // fetchMenuItems(); 
        } else {
            alert('Failed to update menu item availability.');
        }
    } catch (error) {
        console.error('Error updating menu item availability:', error);
        alert('Error updating menu item availability.');
    }
}

function showMenuItemForm(item = {}) {
    let formHtml = `
        <div id="menuItemModal" class="modal">
            <div class="modal-content">
                <span class="close-button" onclick="closeModal()">&times;</span>
                <h2>${item._id ? 'Edit' : 'Add'} Menu Item</h2>
                <form id="menuItemForm">
                    <input type="hidden" id="menuItemId" value="${item._id || ''}">
                    <label for="itemName">Name:</label>
                    <input type="text" id="itemName" value="${item.name || ''}" required>
                    <label for="itemDescription">Description:</label>
                    <textarea id="itemDescription" required>${item.description || ''}</textarea>
                    <label for="itemPrice">Price:</label>
                    <input type="number" id="itemPrice" step="0.01" value="${item.price || ''}" required>
                    <label for="itemCategory">Category:</label>
                    <input type="text" id="itemCategory" value="${item.category || ''}" required>
                    <label for="itemAvailable">Available:</label>
                    <input type="checkbox" id="itemAvailable" ${item.available ? 'checked' : ''}>
                    <button type="submit">${item._id ? 'Update' : 'Add'} Item</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    const modal = document.getElementById('menuItemModal');
    modal.style.display = 'block';

    // Attach event listener to the close button
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    document.getElementById('menuItemForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('menuItemId').value;
        const name = document.getElementById('itemName').value;
        const description = document.getElementById('itemDescription').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const category = document.getElementById('itemCategory').value;
        const available = document.getElementById('itemAvailable').checked;

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/menu-items/${id}` : '/api/menu-items';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, price, category, available }),
            });

            if (response.ok) {
                alert(`Menu item ${id ? 'updated' : 'added'} successfully!`);
                closeModal();
                fetchMenuItems(); // Refresh the list
            } else {
                alert(`Failed to ${id ? 'update' : 'add'} menu item.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'adding'} menu item:`, error);
            alert(`Error ${id ? 'updating' : 'adding'} menu item.`);
        }
    });
}

async function editMenuItem(id) {
    try {
        const response = await fetch(`/api/menu-items/${id}`);
        const item = await response.json();
        if (response.ok) {
            showMenuItemForm(item);
        } else {
            alert('Failed to fetch menu item for editing.');
        }
    } catch (error) {
        console.error('Error fetching menu item for editing:', error);
        alert('Error fetching menu item for editing.');
    }
}

async function deleteMenuItem(id) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        try {
            const response = await fetch(`/api/menu-items/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert('Menu item deleted successfully!');
                fetchMenuItems(); // Refresh the list
            } else {
                alert('Failed to delete menu item.');
            }
        } catch (error) {
            console.error('Error deleting menu item:', error);
            alert('Error deleting menu item.');
        }
    }
}

function closeModal() {
    const modal = document.getElementById('menuItemModal');
    console.log('closeModal called. Modal element:', modal);
    if (modal) {
        modal.remove();
    }
}


// Tab functionality
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Initial load: ensure the active tab content is displayed
    const initialActiveTab = document.querySelector('.tab-button.active');
    if (initialActiveTab) {
        const targetTab = initialActiveTab.dataset.tab;
        document.getElementById(targetTab).classList.add('active');
    }
});