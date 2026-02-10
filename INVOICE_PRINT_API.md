# Invoice Print API - Updates

## ✅ Changes Made

### 1. **Backend API Updated** (`controllers/invoiceController.js`)

**`getInvoiceById` function updated** to return full job card details for printing:

**Endpoint:** `GET /api/invoices/:id`

**Response includes:**
- Invoice details (invoiceNo, amounts, VAT, totals)
- **Full job card details** (all fields needed for printing):
  - Customer information (name, phone, company, address)
  - Vehicle details (type, number, engine model)
  - Job details (type, sub-type, brand, serial)
  - Technician, status, dates, description

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNo": "INV-001",
    "jobCardId": 1,
    "jobCard": "JC-001",
    "labourAmount": 5000,
    "partsAmount": 3000,
    "vatPercentage": 18,
    "vatAmount": 1440,
    "subtotal": 8000,
    "grandTotal": 9440,
    "status": "Unpaid",
    "jobCardDetails": {
      "id": 1,
      "jobNumber": "JC-001",
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
      "technician": "Raj Kumar",
      "status": "Received",
      "receivedDate": "2025-01-15",
      "expectedDeliveryDate": "2025-01-20",
      "description": "Injector cleaning and calibration"
    }
  }
}
```

---

### 2. **Frontend Updated** (`AdminJobCardPrint.jsx`)

**Features Added:**
- ✅ Fetches job card data from API (`GET /api/job-cards/:id`)
- ✅ Fetches invoice data with job card details (`GET /api/invoices/:id`)
- ✅ Supports both job card print and invoice print
- ✅ Auto token handling (from localStorage)
- ✅ Error handling and loading states
- ✅ Update functionality for both job cards and invoices

**Usage:**

**For Job Card Print:**
```
/job-card/print/:id
```

**For Invoice Print:**
```
/job-card/print/:id?type=invoice&invoiceId=1
```

**API Calls:**
1. **Fetch Job Card:** `GET /api/job-cards/:id`
2. **Fetch Invoice:** `GET /api/invoices/:invoiceId`
3. **Update Job Card:** `PUT /api/job-cards/:id`
4. **Update Invoice:** `PUT /api/invoices/:invoiceId`

---

## 📡 API Endpoints Summary

### Job Card APIs

**Get Job Card by ID**
```
GET /api/job-cards/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "jobNumber": "JC-001",
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
    "technician": "Raj Kumar",
    "status": "Received",
    "receivedDate": "2025-01-15",
    "expectedDeliveryDate": "2025-01-20",
    "description": "Injector cleaning and calibration"
  }
}
```

**Update Job Card**
```
PUT /api/job-cards/:id
Authorization: Bearer <token>
Body: {
  "status": "Completed",
  "technician": "Raj",
  "description": "Updated description"
}
```

---

### Invoice APIs

**Get Invoice by ID (with job card details)**
```
GET /api/invoices/:id
Authorization: Bearer <token>
```

**Response:** (See above - includes full job card details)

**Create Invoice from Job Card**
```
POST /api/invoices
Authorization: Bearer <token>
Body: {
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18,
  "status": "Unpaid"
}
```

**Update Invoice**
```
PUT /api/invoices/:id
Authorization: Bearer <token>
Body: {
  "labourAmount": 6000,
  "partsAmount": 4000,
  "vatPercentage": 18,
  "status": "Partially Paid"
}
```

---

## 🔑 Key Features

✅ **Full Job Card Details in Invoice Response**
- All customer information
- All vehicle details
- All job details
- Ready for printing

✅ **Frontend Integration**
- Auto token handling
- Error handling
- Loading states
- Update functionality

✅ **Dual Mode Support**
- Job card print mode
- Invoice print mode (with invoice details)

---

## 📝 Postman Collection

All APIs are already in the Postman collection:
- `GET /api/job-cards/:id` ✅
- `GET /api/invoices/:id` ✅ (Updated with full job card details)
- `POST /api/invoices` ✅
- `PUT /api/invoices/:id` ✅
- `PUT /api/job-cards/:id` ✅

---

## ✅ Testing

**Test Job Card Print:**
```bash
# 1. Login
POST /api/auth/login
Body: { "email": "admin@workshop.com", "password": "password123" }

# 2. Get Job Card
GET /api/job-cards/1
Headers: Authorization: Bearer <token>

# 3. Frontend: Navigate to /job-card/print/1
```

**Test Invoice Print:**
```bash
# 1. Create Invoice
POST /api/invoices
Body: {
  "jobCard": "JC-001",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18
}

# 2. Get Invoice (with job card details)
GET /api/invoices/1

# 3. Frontend: Navigate to /job-card/print/1?type=invoice&invoiceId=1
```

---

## 🎯 Summary

✅ **Backend API Updated** - Invoice API now returns full job card details
✅ **Frontend Updated** - Proper API integration with token handling
✅ **All Fields Available** - Complete data for printing
✅ **Error Handling** - Proper error messages and loading states
✅ **Update Support** - Can update both job cards and invoices

**All APIs are ready and working!** 🚀

