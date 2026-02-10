# 📋 Invoice POST API - JSON Payload Examples

## Endpoint
```
POST {{base_url}}/api/invoices
```

## Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token>"
}
```

---

## 📝 Example 1: Create Invoice from Job Card (Complete)

```json
{
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18,
  "status": "Unpaid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": 1,
    "invoiceNo": "INV-001",
    "jobCard": "JC-001",
    "customerName": "Rajesh Kumar",
    "labourAmount": 5000,
    "partsAmount": 3000,
    "vatPercentage": 18,
    "grandTotal": 9440,
    "status": "Unpaid"
  }
}
```

---

## 📝 Example 2: Create Invoice from Job Card (Minimal)

```json
{
  "jobCard": "JC-001"
}
```

**Notes:**
- Only job card number required
- All amounts default to 0
- Status defaults to "Unpaid"
- VAT defaults to 0%

---

## 📝 Example 3: Create Invoice from Quotation

```json
{
  "quotation": "QT-001",
  "status": "Unpaid"
}
```

**Notes:**
- Invoice data will be taken from quotation
- Labour, parts, and VAT from quotation
- Can override status

---

## 📝 Example 4: Create Invoice with Custom Amounts

```json
{
  "jobCard": "JC-001",
  "labourAmount": 7500,
  "partsAmount": 4500,
  "vatPercentage": 15,
  "status": "Unpaid"
}
```

**Calculation:**
- Subtotal: 7500 + 4500 = 12000
- VAT (15%): 12000 × 0.15 = 1800
- Grand Total: 12000 + 1800 = 13800

---

## 📝 Example 5: Create Invoice - All Fields

```json
{
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18,
  "status": "Unpaid"
}
```

---

## 📋 Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `quotation` | string | No* | - | Quotation number (QT-001) |
| `jobCard` | string | Yes* | - | Job card number (JC-001) |
| `customerName` | string | No | - | Customer name |
| `labourAmount` | number | No | 0 | Labour charges |
| `partsAmount` | number | No | 0 | Parts charges |
| `vatPercentage` | number | No | 0 | VAT percentage |
| `status` | string | No | "Unpaid" | Invoice status |

*Either `quotation` OR `jobCard` must be provided

---

## 🔢 Status Values

- `"Unpaid"` - Invoice not paid
- `"Partially Paid"` - Partial payment received
- `"Paid"` - Fully paid

---

## 💡 Quick Copy for Postman

### Option 1: From Job Card (Recommended)
```json
{
  "jobCard": "JC-001",
  "customerName": "Rajesh Kumar",
  "labourAmount": 5000,
  "partsAmount": 3000,
  "vatPercentage": 18,
  "status": "Unpaid"
}
```

### Option 2: From Quotation
```json
{
  "quotation": "QT-001",
  "status": "Unpaid"
}
```

### Option 3: Minimal (Only Job Card)
```json
{
  "jobCard": "JC-001"
}
```

---

## ✅ Postman Setup

1. **Method:** POST
2. **URL:** `{{base_url}}/api/invoices`
3. **Headers:**
   - `Content-Type: application/json`
   - `Authorization: Bearer {{auth_token}}`
4. **Body:** Select "raw" → "JSON"
5. **Paste:** Any example above

---

## 🧮 Auto-Calculation

**Grand Total Formula:**
```
Subtotal = labourAmount + partsAmount
VAT Amount = (Subtotal × vatPercentage) / 100
Grand Total = Subtotal + VAT Amount
```

**Example:**
- Labour: 5000
- Parts: 3000
- VAT: 18%
- Subtotal: 8000
- VAT Amount: 1440
- **Grand Total: 9440**

---

## 📌 Important Notes

1. ✅ Invoice number is **auto-generated** (INV-001, INV-002, etc.)
2. ✅ Either `quotation` OR `jobCard` must be provided
3. ✅ If `quotation` provided, amounts taken from quotation
4. ✅ If `jobCard` provided, you can set amounts manually
5. ✅ Grand total is **auto-calculated** by backend
6. ✅ All amounts are in **SAR** (Saudi Riyal)

---

**Ready to use in Postman!** 🚀

