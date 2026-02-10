# 📡 Workshop Management API - Complete Reference

## 🔐 Authentication

### Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "admin@workshop.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@workshop.com",
    "role": "admin"
  }
}
```

---

## 👥 Users (Admin Only)

### Get All Users
```
GET /api/users?role=admin
Authorization: Bearer <token>
```

### Get User by ID
```
GET /api/users/:id
Authorization: Bearer <token>
```

### Create User
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "Raj Kumar",
  "email": "raj@workshop.com",
  "phone": "+91 98765 43210",
  "role": "technician",
  "login_access": true,
  "password": "password123"
}
```

### Update User
```
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "Raj Kumar Updated",
  "phone": "+91 98765 43211",
  "login_access": true
}
```

### Delete User
```
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## 👤 Customers (Admin & Storekeeper)

### Get All Customers
```
GET /api/customers?search=rajesh
Authorization: Bearer <token>
```

### Get Customer by ID
```
GET /api/customers/:id
Authorization: Bearer <token>
```

### Create Customer
```
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43213",
  "company": "Doe Transport",
  "address": "123 Business Street, Mumbai"
}
```

### Update Customer
```
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "John Doe Updated",
  "phone": "+91 98765 43214",
  "address": "456 New Street, Mumbai"
}
```

### Delete Customer
```
DELETE /api/customers/:id
Authorization: Bearer <token>
```

---

## 📋 Job Cards

### Get All Job Cards
```
GET /api/job-cards?status=Received&technician=Raj&vehicleType=Truck&search=JC-001
Authorization: Bearer <token>
```

### Get Job Card by ID
```
GET /api/job-cards/:id
Authorization: Bearer <token>
```

### Create Job Card
```
POST /api/job-cards
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "customerName": "Rajesh Kumar",
  "customerPhone": "+91 98765 43210",
  "companyName": "Kumar Transport",
  "vehicleType": "Truck",
  "vehicleNumber": "MH-01-AB-1234",
  "engineModel": "Cummins ISX",
  "jobType": "Injector",
  "jobSubType": "CRDI",
  "brand": "BOSCH",
  "pumpInjectorSerial": "BOSCH-12345",
  "technician": "Raj",
  "status": "Received",
  "receivedDate": "2025-01-15",
  "expectedDeliveryDate": "2025-01-20",
  "description": "Injector cleaning and calibration"
}
```

### Update Job Card
```
PUT /api/job-cards/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "Under Repair",
  "technician": "Amit",
  "description": "Updated description"
}
```

### Delete Job Card
```
DELETE /api/job-cards/:id
Authorization: Bearer <token>
```

---

## 🧪 Testing Records

### Get All Testing Records
```
GET /api/testing-records
Authorization: Bearer <token>
```

### Get Testing Record by ID
```
GET /api/testing-records/:id
Authorization: Bearer <token>
```

### Create Testing Record
```
POST /api/testing-records
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "jobCardNumber": "JC-001",
  "customerName": "Rajesh Kumar",
  "jobType": "Injector - CRDI",
  "brand": "BOSCH",
  "beforeRepair": {
    "pressure": "1200",
    "leak": "5",
    "calibration": "95",
    "passFail": "Fail"
  },
  "afterRepair": {
    "pressure": "1500",
    "leak": "2",
    "calibration": "98",
    "passFail": "Pass"
  },
  "injectorParams": {
    "pilotInjection": "2.5",
    "mainInjection": "15.0",
    "returnFlow": "50",
    "pressure": "1500",
    "leakTest": "Pass"
  },
  "testDate": "2025-01-15"
}
```

### Update Testing Record
```
PUT /api/testing-records/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "afterRepair": {
    "pressure": "1600",
    "leak": "1",
    "calibration": "99",
    "passFail": "Pass"
  }
}
```

### Delete Testing Record
```
DELETE /api/testing-records/:id
Authorization: Bearer <token>
```

---

## 📦 Inventory (Admin & Storekeeper)

### Get All Inventory Items
```
GET /api/inventory?category=Plunger&status=Low&search=plunger
Authorization: Bearer <token>
```

### Get Inventory Item by ID
```
GET /api/inventory/:id
Authorization: Bearer <token>
```

### Create Inventory Item
```
POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "partName": "Control Valve",
  "partCode": "CV-001",
  "category": "Control Valve",
  "supplier": "BOSCH India",
  "availableStock": 20,
  "minStockLevel": 10
}
```

### Update Inventory Item
```
PUT /api/inventory/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "availableStock": 15,
  "minStockLevel": 12
}
```

### Delete Inventory Item
```
DELETE /api/inventory/:id
Authorization: Bearer <token>
```

### Stock In - Add Stock
```
POST /api/inventory/:id/stock-in
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "quantity": 10,
  "notes": "New stock received from supplier"
}
```

### Stock Out - Deduct Stock
```
POST /api/inventory/:id/stock-out
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "quantity": 5,
  "notes": "Used for job card JC-001"
}
```

### Get Stock Transactions
```
GET /api/inventory/:id/transactions
Authorization: Bearer <token>
```

---

## 💰 Quotations (Admin Only)

### Get All Quotations
```
GET /api/quotations?status=Draft
Authorization: Bearer <token>
```

### Get Quotation by ID
```
GET /api/quotations/:id
Authorization: Bearer <token>
```

### Create Quotation
```
POST /api/quotations
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourCharges": 5000,
  "partsCharges": 3000,
  "vatPercentage": 18,
  "validUntil": "2025-02-15",
  "status": "Draft"
}
```

### Update Quotation
```
PUT /api/quotations/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "labourCharges": 6000,
  "partsCharges": 4000,
  "status": "Sent"
}
```

### Delete Quotation
```
DELETE /api/quotations/:id
Authorization: Bearer <token>
```

---

## 🧾 Invoices (Admin Only)

### Get All Invoices
```
GET /api/invoices?status=Unpaid
Authorization: Bearer <token>
```

### Get Invoice by ID (with job card details)
```
GET /api/invoices/:id
Authorization: Bearer <token>
```

### Create Invoice from Quotation
```
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "quotation": "QT-001",
  "status": "Unpaid"
}
```

### Create Invoice from Job Card
```
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18,
  "status": "Unpaid"
}
```

### Update Invoice
```
PUT /api/invoices/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "labourAmount": 6000,
  "partsAmount": 4000,
  "vatPercentage": 18,
  "status": "Partially Paid"
}
```

### Delete Invoice
```
DELETE /api/invoices/:id
Authorization: Bearer <token>
```

---

## 💵 Payments (Admin Only)

### Get All Payments
```
GET /api/payments?paymentMode=Cash
Authorization: Bearer <token>
```

### Get Payment by ID
```
GET /api/payments/:id
Authorization: Bearer <token>
```

### Record Payment
```
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "invoice": "INV-001",
  "customerName": "Rajesh Kumar",
  "invoiceAmount": 9440,
  "amountPaid": 5000,
  "balanceAmount": 4440,
  "paymentMode": "Cash",
  "paymentDate": "2025-01-15"
}
```

### Update Payment
```
PUT /api/payments/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "amountPaid": 6000,
  "paymentMode": "Bank Transfer"
}
```

### Delete Payment
```
DELETE /api/payments/:id
Authorization: Bearer <token>
```

### Get Payment Statistics
```
GET /api/payments/stats/summary
Authorization: Bearer <token>
```

---

## 📊 Reports

### Daily Sales Report
```
GET /api/reports/daily-sales?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

### Monthly Sales Report
```
GET /api/reports/monthly-sales?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

### Job History by Customer
```
GET /api/reports/job-history-customer?customerId=1
Authorization: Bearer <token>
```

### Job History by Serial Number
```
GET /api/reports/job-history-serial?serialNumber=BOSCH-12345
Authorization: Bearer <token>
```

### Labour Profit Report
```
GET /api/reports/labour-profit?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

### Parts Profit Report
```
GET /api/reports/parts-profit?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

### Warranty Tracking Report
```
GET /api/reports/warranty-tracking
Authorization: Bearer <token>
```

---

## 🏥 Health Check

### Health Check
```
GET /health
(No authentication required)
```

---

## 📝 Notes

### Base URL
```
http://localhost:8000
```

### Authentication
- Most endpoints require `Authorization: Bearer <token>` header
- Get token from `/api/auth/login`
- Token expires in 24 hours (default)

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🧪 Quick Test Flow

1. **Login**
   ```
   POST /api/auth/login
   Body: { "email": "admin@workshop.com", "password": "password123" }
   ```

2. **Create Customer**
   ```
   POST /api/customers
   Body: { "name": "Test Customer", "phone": "+91 1234567890" }
   ```

3. **Create Job Card**
   ```
   POST /api/job-cards
   Body: { "customerName": "Test Customer", "vehicleType": "Truck", ... }
   ```

4. **Create Invoice**
   ```
   POST /api/invoices
   Body: { "jobCard": "JC-001", "labourAmount": 5000, ... }
   ```

5. **Record Payment**
   ```
   POST /api/payments
   Body: { "invoice": "INV-001", "amountPaid": 5000, ... }
   ```

---

**✅ All APIs ready for Postman testing!**

