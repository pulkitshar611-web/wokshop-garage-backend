# Stock In/Out API - Changes Made

## 📋 Summary

Inventory के लिए Stock In/Out API endpoints add किए गए हैं और schema में `stock_transactions` table add किया गया है।

## 🔧 Files Modified

### 1. **`controllers/inventoryController.js`**
**Location:** `workshop-backend/controllers/inventoryController.js`

**Added Functions:**
- `stockIn()` - Stock add करने के लिए (line ~350)
- `stockOut()` - Stock deduct करने के लिए (line ~420)
- `getStockTransactions()` - Stock transactions history देखने के लिए (line ~520)

**Key Features:**
- Stock In: Quantity add करता है और transaction record create करता है
- Stock Out: Quantity deduct करता है, sufficient stock check करता है
- Both functions database transactions use करते हैं (rollback support)
- Stock status automatically update होता है (Low/OK)

### 2. **`routes/inventoryRoutes.js`**
**Location:** `workshop-backend/routes/inventoryRoutes.js`

**Added Routes:**
- `POST /api/inventory/:id/stock-in` - Stock add करने के लिए (line ~30)
- `POST /api/inventory/:id/stock-out` - Stock deduct करने के लिए (line ~33)
- `GET /api/inventory/:id/transactions` - Transactions history देखने के लिए (line ~36)

### 3. **`database/schema.sql`**
**Location:** `workshop-backend/database/schema.sql`

**Added Table:** `stock_transactions` (line ~103-117)

**Table Structure:**
```sql
CREATE TABLE IF NOT EXISTS stock_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  transaction_type ENUM('Stock In', 'Stock Out') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_item (inventory_item_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
)
```

**Columns Added:**
- `id` - Primary key
- `inventory_item_id` - Foreign key to inventory_items
- `transaction_type` - 'Stock In' or 'Stock Out'
- `quantity` - Transaction quantity
- `previous_stock` - Stock before transaction
- `new_stock` - Stock after transaction
- `notes` - Optional notes
- `created_by` - User who created transaction
- `created_at` - Transaction timestamp

### 4. **`Workshop_Management_API.postman_collection.json`**
**Location:** `workshop-backend/Workshop_Management_API.postman_collection.json`

**Added Requests in Inventory Section:**
- **Stock In - Add Stock** (line ~1029)
  - Method: POST
  - URL: `{{base_url}}/api/inventory/:id/stock-in`
  - Body: `{ "quantity": 10, "notes": "..." }`

- **Stock Out - Deduct Stock** (line ~1070)
  - Method: POST
  - URL: `{{base_url}}/api/inventory/:id/stock-out`
  - Body: `{ "quantity": 5, "notes": "..." }`

- **Get Stock Transactions** (line ~1110)
  - Method: GET
  - URL: `{{base_url}}/api/inventory/:id/transactions`

## 📡 API Endpoints

### Stock In
```
POST /api/inventory/:id/stock-in
Authorization: Bearer <token>
Body: {
  "quantity": 10,
  "notes": "New stock received"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock added successfully. New stock: 35",
  "data": {
    "id": 1,
    "partName": "Plunger Set",
    "availableStock": 35,
    "status": "OK"
  }
}
```

### Stock Out
```
POST /api/inventory/:id/stock-out
Authorization: Bearer <token>
Body: {
  "quantity": 5,
  "notes": "Used for job card JC-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock deducted successfully. Remaining stock: 30",
  "data": {
    "id": 1,
    "partName": "Plunger Set",
    "availableStock": 30,
    "status": "OK"
  }
}
```

### Get Stock Transactions
```
GET /api/inventory/:id/transactions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "transactionType": "Stock In",
      "quantity": 10,
      "previousStock": 25,
      "newStock": 35,
      "notes": "New stock received",
      "createdBy": "Admin User",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

## 🔄 Database Update Required

**Important:** Schema में नया table add किया गया है। Database update करें:

```bash
# Option 1: Run only the new table creation
mysql -u root -p workshop_db < add_stock_transactions.sql

# Option 2: Re-run entire schema (if starting fresh)
mysql -u root -p < database/schema.sql
```

**Or manually in MySQL:**
```sql
USE workshop_db;

CREATE TABLE IF NOT EXISTS stock_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  transaction_type ENUM('Stock In', 'Stock Out') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_item (inventory_item_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## ✅ Testing

1. **Stock In Test:**
   ```bash
   curl -X POST http://localhost:8000/api/inventory/1/stock-in \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"quantity": 10, "notes": "Test stock in"}'
   ```

2. **Stock Out Test:**
   ```bash
   curl -X POST http://localhost:8000/api/inventory/1/stock-out \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"quantity": 5, "notes": "Test stock out"}'
   ```

3. **Get Transactions:**
   ```bash
   curl http://localhost:8000/api/inventory/1/transactions \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 📝 Notes

- ✅ Stock In/Out operations database transactions use करते हैं (atomic operations)
- ✅ Stock Out में insufficient stock check होता है
- ✅ हर transaction record होता है (audit trail)
- ✅ Stock status automatically update होता है (Low/OK)
- ✅ User ID track होता है (किसने transaction किया)
- ✅ Notes field optional है

## 🎯 Frontend Integration

Frontend में `AdminInventory.jsx` में already Stock In/Out modals हैं। अब backend API ready है:

- `handleStockIn()` - `POST /api/inventory/:id/stock-in` call करे
- `handleStockOut()` - `POST /api/inventory/:id/stock-out` call करे

