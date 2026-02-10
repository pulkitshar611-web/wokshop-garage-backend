# Postman Collection Guide

## 📥 How to Import the Collection

1. **Open Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Workshop_Management_API.postman_collection.json`
5. Click **Import**

## 🔧 Setup Variables

The collection uses two variables:

1. **`base_url`** - Default: `http://localhost:8000`
   - Change this if your API runs on a different URL
   - Right-click collection → Edit → Variables tab

2. **`auth_token`** - Auto-populated after login
   - Automatically saved when you run the "Login - Admin" request
   - Used by all authenticated requests

## 🚀 Quick Start

### Step 1: Test Health Check
1. Open **Health Check** request
2. Click **Send**
3. Should return: `{"success": true, "message": "Workshop Management API is running"}`

### Step 2: Login
1. Open **Authentication** → **Login - Admin**
2. Click **Send**
3. Check the **Tests** tab - token is automatically saved
4. You should see: `Token saved: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Use Any Endpoint
1. All other requests will automatically use the saved token
2. Just click **Send** on any request

## 📁 Collection Structure

```
Workshop Management API
├── Authentication
│   ├── Login - Admin
│   ├── Login - Technician
│   └── Login - Storekeeper
├── Users (Admin only)
│   ├── Get All Users
│   ├── Get User by ID
│   ├── Create User
│   ├── Update User
│   └── Delete User
├── Customers (Admin, Storekeeper)
│   ├── Get All Customers
│   ├── Get Customer by ID
│   ├── Create Customer
│   ├── Update Customer
│   └── Delete Customer
├── Job Cards
│   ├── Get All Job Cards
│   ├── Get Job Card by ID
│   ├── Create Job Card
│   ├── Update Job Card
│   └── Delete Job Card
├── Testing Records
│   ├── Get All Testing Records
│   ├── Get Testing Record by ID
│   ├── Create Testing Record
│   ├── Update Testing Record
│   └── Delete Testing Record
├── Inventory (Admin, Storekeeper)
│   ├── Get All Inventory Items
│   ├── Get Inventory Item by ID
│   ├── Create Inventory Item
│   ├── Update Inventory Item
│   └── Delete Inventory Item
├── Quotations (Admin only)
│   ├── Get All Quotations
│   ├── Get Quotation by ID
│   ├── Create Quotation
│   ├── Update Quotation
│   └── Delete Quotation
├── Invoices (Admin only)
│   ├── Get All Invoices
│   ├── Get Invoice by ID
│   ├── Create Invoice from Quotation
│   ├── Create Invoice from Job Card
│   ├── Update Invoice
│   └── Delete Invoice
├── Payments (Admin only)
│   ├── Get All Payments
│   ├── Get Payment by ID
│   ├── Record Payment
│   ├── Update Payment
│   ├── Delete Payment
│   └── Get Payment Statistics
├── Reports
│   ├── Daily Sales Report
│   ├── Monthly Sales Report
│   ├── Job History by Customer
│   ├── Job History by Serial Number
│   ├── Labour Profit Report
│   ├── Parts Profit Report
│   └── Warranty Tracking Report
└── Health Check
```

## 🔑 Authentication

### How It Works
1. Run **Login - Admin** request
2. Response includes a `token` field
3. The **Tests** script automatically saves it to `auth_token` variable
4. All other requests use Bearer token authentication

### Manual Token Setup
If you need to set token manually:
1. Right-click collection → Edit
2. Go to **Variables** tab
3. Set `auth_token` value
4. Click **Save**

## 📝 Example Workflows

### Create a Complete Job Flow
1. **Create Customer** → Get customer ID
2. **Create Job Card** → Get job number (JC-001)
3. **Create Testing Record** → Link to job card
4. **Create Quotation** → Link to job card
5. **Create Invoice** → From quotation
6. **Record Payment** → Against invoice

### Test Different Roles
1. Login as **Admin** → Full access
2. Login as **Technician** → Access job cards and testing records
3. Login as **Storekeeper** → Access inventory and customers

## 🎯 Tips

1. **Use Collection Variables**: Change `base_url` once, affects all requests
2. **Save Responses**: Right-click response → Save Response → Save as Example
3. **Use Environments**: Create different environments for dev/staging/prod
4. **Organize with Folders**: The collection is already organized by module
5. **Check Descriptions**: Each request has a description explaining its purpose

## 🐛 Troubleshooting

### Token Not Saving
- Check **Tests** tab in Login request
- Manually set `auth_token` variable

### 401 Unauthorized
- Token expired or invalid
- Run Login request again

### 403 Forbidden
- User role doesn't have permission
- Check if you're logged in as the right role

### 404 Not Found
- Check `base_url` variable
- Verify endpoint path is correct

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Check request body format

## 📚 Additional Resources

- See `README.md` for complete API documentation
- See `SETUP.md` for backend setup instructions
- Check server logs for detailed error messages

