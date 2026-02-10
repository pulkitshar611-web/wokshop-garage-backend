# Demo Data Setup Guide

## 📋 Overview

Schema में सभी tables के लिए demo data add किया गया है:

### 👥 Users (3 Demo Users)
1. **Admin User** - admin@workshop.com
2. **Raj Kumar** (Technician) - tech@workshop.com  
3. **Priya Singh** (Storekeeper) - store@workshop.com

**सभी users का password:** `password123`

### 📊 Demo Data in All Tables

1. **Customers** - 1 customer (Rajesh Kumar)
2. **Job Cards** - 1 job card (JC-001) linked to customer and technician
3. **Testing Records** - 1 testing record linked to job card
4. **Inventory Items** - 1 inventory item (Plunger Set)
5. **Quotations** - 1 quotation (QT-001) linked to job card
6. **Invoices** - 1 invoice (INV-001) linked to job card and quotation
7. **Payments** - 1 payment (PAY-001) linked to invoice

## 🚀 Setup Steps

### Step 1: Create Database and Tables
```bash
mysql -u root -p < database/schema.sql
```

यह command:
- Database `workshop_db` create करेगा
- सभी tables create करेगा
- Demo data insert करेगा (users के passwords placeholder होंगे)

### Step 2: Update User Passwords
```bash
node database/seed.js
```

यह script:
- सभी 3 users के passwords को properly hash करेगा
- Password: `password123` (सभी users के लिए)

## 🔑 Login Credentials

### Admin
- **Email:** admin@workshop.com
- **Password:** password123
- **Role:** admin (full access)

### Technician  
- **Email:** tech@workshop.com
- **Password:** password123
- **Role:** technician (job cards & testing records)

### Storekeeper
- **Email:** store@workshop.com
- **Password:** password123
- **Role:** storekeeper (inventory & customers)

## 📝 Demo Data Details

### Customer
- **Name:** Rajesh Kumar
- **Email:** rajesh@example.com
- **Phone:** +91 98765 43210
- **Company:** Kumar Transport

### Job Card (JC-001)
- **Customer:** Rajesh Kumar
- **Technician:** Raj Kumar
- **Vehicle:** Truck (MH-01-AB-1234)
- **Job Type:** Injector - CRDI
- **Brand:** BOSCH
- **Status:** Received

### Testing Record
- **Job Card:** JC-001
- **Before Repair:** Fail
- **After Repair:** Pass
- **Test Date:** 2025-01-15

### Inventory Item
- **Part Name:** Plunger Set
- **Part Code:** PLG-001
- **Category:** Plunger
- **Stock:** 25 (Min: 10)

### Quotation (QT-001)
- **Job Card:** JC-001
- **Labour:** ₹5,000
- **Parts:** ₹3,000
- **VAT:** 18%
- **Total:** ₹9,440
- **Status:** Draft

### Invoice (INV-001)
- **Job Card:** JC-001
- **Quotation:** QT-001
- **Total:** ₹9,440
- **Status:** Unpaid

### Payment (PAY-001)
- **Invoice:** INV-001
- **Amount:** ₹5,000
- **Mode:** Cash
- **Date:** 2025-01-15

## ✅ Verification

Setup के बाद verify करें:

1. **Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Login Test:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@workshop.com","password":"password123"}'
   ```

3. **Get All Users:**
   ```bash
   curl http://localhost:8000/api/users \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 🔄 Reset Demo Data

अगर demo data reset करना हो:

1. Database drop करें:
   ```sql
   DROP DATABASE IF EXISTS workshop_db;
   ```

2. फिर से setup करें:
   ```bash
   mysql -u root -p < database/schema.sql
   node database/seed.js
   ```

## 📌 Notes

- सभी demo data `ON DUPLICATE KEY UPDATE` के साथ insert होता है
- अगर data पहले से exist करता है, तो update होगा (duplicate नहीं होगा)
- Users के passwords seed.js script से properly hash होते हैं
- Foreign key relationships properly maintain होती हैं

