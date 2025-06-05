document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('orderDate').value = `${yyyy}-${mm}-${dd}`;
    fetchOrders();

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
                    <select onchange="updateOrderStatus('${order._id}', this.value)">
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

    } catch (error) {
        console.error('Error fetching orders:', error);
        ordersList.innerHTML = '<p>Error loading orders.</p>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            console.log(`Order ${orderId} status updated to ${newStatus}`);
            // Optionally, re-fetch orders to update the display
            fetchOrders(); 
        } else {
            console.error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}