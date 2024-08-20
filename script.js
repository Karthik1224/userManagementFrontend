let currentPage = 1; // Initialize current page number
let sortBy = document.getElementById('searchBy').value; // Initialize sortBy with the default value

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form from submitting normally

    const email = document.getElementById('userid').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://usermanagement-production-701c.up.railway.app/api/v1/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwtToken', data.jwtToken);
            document.getElementById('loginpage').style.display = 'none';
            document.getElementById('mainpage').style.display = 'block';
            await fetchAndDisplayCustomers(currentPage);
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Error: Unable to connect to the server.");
    }
});

async function fetchAndDisplayCustomers(pageNo) {
    const fetchAllReqDto = {
        pageNo: pageNo,
        pageSize: 5,
        sortBy: sortBy
    };

    try {
        const response = await fetch('https://usermanagement-production-701c.up.railway.app/api/v1/customer/fetchAll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            },
            body: JSON.stringify(fetchAllReqDto)
        });

        if (response.ok) {
            const data = await response.json();
            const customers = data.result;
            const tableBody = document.getElementById('customerTableBody');
            tableBody.innerHTML = '';

            customers.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.firstName}</td>
                    <td>${customer.lastName}</td>
                    <td>${customer.address}</td>
                    <td>${customer.city}</td>
                    <td>${customer.state}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>
                        <button class="edit-btn" data-customer='${JSON.stringify(customer)}'>Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Add event listeners to edit and delete buttons
            addEditButtonListeners();
            addDeleteButtonListeners();
        } else {
            const errorData = await response.json();
            alert(`Failed to fetch customer data: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error fetching customers:", error);
        alert("Error: Unable to connect to the server.");
    }
}

function addEditButtonListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const customer = JSON.parse(this.getAttribute('data-customer'));
            loadCustomerDataForEdit(customer);
        });
    });
}

function addDeleteButtonListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const phone = row.querySelector('td:nth-child(7)').textContent;

            if (confirm('Are you sure you want to delete this customer?')) {
                try {
                    const deleteResponse = await fetch(`https://usermanagement-production-701c.up.railway.app/api/v1/customer/delete?phone=${encodeURIComponent(phone)}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
                        }
                    });

                    if (deleteResponse.ok) {
                        row.remove();
                        alert('Customer deleted successfully.');
                    } else {
                        const errorData = await deleteResponse.json();
                        alert(`Failed to delete customer: ${errorData.message}`);
                    }
                } catch (error) {
                    console.error("Error deleting customer:", error);
                    alert('Error: Unable to connect to the server.');
                }
            }
        });
    });
}

document.getElementById('nextButton').addEventListener('click', function() {
    currentPage++;
    fetchAndDisplayCustomers(currentPage);
});

document.getElementById('prevButton').addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        fetchAndDisplayCustomers(currentPage);
    }
});

document.getElementById('searchBy').addEventListener('change', function() {
    sortBy = this.value;
    fetchAndDisplayCustomers(currentPage);
});

document.getElementById('addCustomerButton').addEventListener('click', function() {
    document.getElementById('mainpage').style.display = 'none';
    document.getElementById('customerFormPage').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Add Customer';
    document.getElementById('customerForm').reset();
});

document.getElementById('cancelButton').addEventListener('click', function() {
    document.getElementById('customerFormPage').style.display = 'none';
    document.getElementById('mainpage').style.display = 'block';
});

document.getElementById('customerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    try {
        const url = document.getElementById('formTitle').textContent === 'Add Customer'
            ? 'https://usermanagement-production-701c.up.railway.app/api/v1/customer/add'
            : 'https://usermanagement-production-701c.up.railway.app/api/v1/customer/update';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Customer saved successfully.');
            document.getElementById('customerFormPage').style.display = 'none';
            document.getElementById('mainpage').style.display = 'block';
            await fetchAndDisplayCustomers(currentPage);
        } else {
            const errorData = await response.json();
            alert(`Failed to save customer: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error saving customer:", error);
        alert('Error: Unable to connect to the server.');
    }
});

function loadCustomerDataForEdit(customer) {
    document.getElementById('mainpage').style.display = 'none';
    document.getElementById('customerFormPage').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Edit Customer';
    document.getElementById('firstName').value = customer.firstName;
    document.getElementById('lastName').value = customer.lastName;
    document.getElementById('address').value = customer.address;
    document.getElementById('city').value = customer.city;
    document.getElementById('state').value = customer.state;
    document.getElementById('email').value = customer.email;
    document.getElementById('phone').value = customer.phone;
}

document.getElementById('syncButton').addEventListener('click', async function() {
    try {
        const response = await fetch('https://usermanagement-production-701c.up.railway.app/api/v1/customer/sync', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            }
        });

        if (response.ok) {
            alert('Data synchronized successfully.');
            await fetchAndDisplayCustomers(currentPage);
        } else {
            const errorData = await response.json();
            alert(`Failed to synchronize data: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error synchronizing data:", error);
        alert('Error: Unable to connect to the server.');
    }
});
