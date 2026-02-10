# Database Import Guide - कौन सा File Run करें?

## 🎯 Quick Decision

### Scenario 1: Fresh Start (पहली बार database setup)
→ **`schema.sql`** run करें

### Scenario 2: Database पहले से exist करता है (सिर्फ नया table add करना)
→ **`add_stock_transactions_table.sql`** run करें

---

## 📋 Step-by-Step Instructions

### Option A: Fresh Database Setup (Recommended for First Time)

**Step 1: Complete Schema Import**
```bash
cd workshop-backend
mysql -u root -p < database/schema.sql
```

यह command:
- ✅ Database `workshop_db` create करेगा
- ✅ सभी tables create करेगा (users, customers, job_cards, inventory, stock_transactions, etc.)
- ✅ Demo data insert करेगा

**Step 2: Users के Passwords Hash करें**
```bash
node database/seed.js
```

यह command:
- ✅ सभी 3 users (admin, technician, storekeeper) के passwords properly hash करेगा
- ✅ Password: `password123` (सभी के लिए)

---

### Option B: Existing Database में सिर्फ Stock Transactions Table Add करना

अगर आपका database पहले से exist करता है और सिर्फ `stock_transactions` table add करना है:

```bash
cd workshop-backend
mysql -u root -p workshop_db < database/add_stock_transactions_table.sql
```

---

## 🔍 कैसे Check करें कि Database Exist करता है?

### MySQL Command Line में:
```sql
SHOW DATABASES;
```

अगर `workshop_db` दिखे तो database exist करता है।

### Tables Check करें:
```sql
USE workshop_db;
SHOW TABLES;
```

अगर `stock_transactions` table नहीं दिखे, तो `add_stock_transactions_table.sql` run करें।

---

## ✅ Complete Setup (Recommended)

अगर आप sure नहीं हैं, तो complete setup करें:

```bash
# Step 1: Complete schema (database + tables + demo data)
mysql -u root -p < database/schema.sql

# Step 2: Users passwords hash करें
node database/seed.js
```

---

## 🧪 Verify करें

Database import के बाद verify करें:

```sql
USE workshop_db;

-- Check tables
SHOW TABLES;
-- Should show: users, customers, job_cards, inventory_items, stock_transactions, etc.

-- Check stock_transactions table
DESCRIBE stock_transactions;
-- Should show all columns

-- Check users
SELECT id, name, email, role FROM users;
-- Should show 3 users: Admin, Raj Kumar, Priya Singh
```

---

## 📝 Files Summary

| File | Purpose | When to Use |
|------|---------|-------------|
| `schema.sql` | Complete database setup | Fresh start, first time setup |
| `add_stock_transactions_table.sql` | सिर्फ stock_transactions table | Existing database में नया table add करना |
| `seed.js` | Users passwords hash करना | हमेशा run करें (users create/update के बाद) |

---

## 🚀 Quick Commands

### Complete Fresh Setup:
```bash
mysql -u root -p < database/schema.sql
node database/seed.js
```

### Just Add Stock Transactions Table:
```bash
mysql -u root -p workshop_db < database/add_stock_transactions_table.sql
```

---

## ⚠️ Important Notes

1. **Password Required:** MySQL root password enter करना होगा
2. **Database Name:** Default `workshop_db` है (`.env` में change कर सकते हैं)
3. **Users:** `seed.js` run करना जरूरी है (passwords hash के लिए)
4. **Demo Data:** `schema.sql` में demo data included है

---

## ✅ Success Indicators

Setup successful होने पर:

```sql
USE workshop_db;
SHOW TABLES;
-- Should show: users, customers, job_cards, testing_records, inventory_items, stock_transactions, quotations, invoices, payments

SELECT COUNT(*) FROM users;
-- Should return: 3

SELECT COUNT(*) FROM stock_transactions;
-- Should return: 0 (empty table, ready for use)
```

---

**💡 Recommendation:** अगर पहली बार setup कर रहे हैं, तो **`schema.sql`** run करें, फिर **`seed.js`** run करें।

