# Workshop Management System - Backend API

Complete Node.js + Express + MySQL backend for the Workshop Management System. Built with raw SQL queries (no ORM) using mysql2 with async/await.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd workshop-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=workshop_db
   DB_PORT=3306
   
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

4. **Create database and tables**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Seed admin user**
   ```bash
   node database/seed.js
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

The API will be available at `http://localhost:8000/api`

## 📁 Project Structure

```
workshop-backend/
├── config/
│   └── db.js                 # MySQL connection pool
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── userRoutes.js         # User management routes
│   ├── customerRoutes.js     # Customer routes
│   ├── jobCardRoutes.js      # Job card routes
│   ├── testingRecordRoutes.js # Testing record routes
│   ├── inventoryRoutes.js    # Inventory routes
│   ├── quotationRoutes.js   # Quotation routes
│   ├── invoiceRoutes.js     # Invoice routes
│   ├── paymentRoutes.js     # Payment routes
│   └── reportRoutes.js      # Report routes
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js    # User CRUD operations
│   ├── customerController.js # Customer CRUD operations
│   ├── jobCardController.js  # Job card CRUD operations
│   ├── testingRecordController.js # Testing record CRUD
│   ├── inventoryController.js # Inventory CRUD operations
│   ├── quotationController.js # Quotation CRUD operations
│   ├── invoiceController.js # Invoice CRUD operations
│   ├── paymentController.js # Payment CRUD operations
│   └── reportController.js  # Report generation
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.js             # Seed script for admin user
├── uploads/                 # File uploads directory
├── .env                     # Environment variables
├── package.json
├── server.js               # Express server entry point
└── README.md
```

## 🔐 Authentication

### Default Admin Credentials

- **Email**: `admin@workshop.com`
- **Password**: `password123`

### Authentication Flow

1. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "admin@workshop.com",
     "password": "password123"
   }
   ```

2. **Response**: Returns JWT token and user data
   ```json
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

3. **Use Token**: Include in Authorization header for protected routes
   ```
   Authorization: Bearer <token>
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers (Admin, Storekeeper)
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Job Cards
- `GET /api/job-cards` - Get all job cards (with filters)
- `GET /api/job-cards/:id` - Get job card by ID
- `POST /api/job-cards` - Create job card (auto-generates job number)
- `PUT /api/job-cards/:id` - Update job card
- `DELETE /api/job-cards/:id` - Delete job card

### Testing Records
- `GET /api/testing-records` - Get all testing records
- `GET /api/testing-records/:id` - Get testing record by ID
- `POST /api/testing-records` - Create testing record
- `PUT /api/testing-records/:id` - Update testing record
- `DELETE /api/testing-records/:id` - Delete testing record

### Inventory (Admin, Storekeeper)
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Quotations (Admin Only)
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get quotation by ID
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation

### Invoices (Admin Only)
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Payments (Admin Only)
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/stats/summary` - Get payment statistics

### Reports
- `GET /api/reports/:reportType` - Generate report
  - Report types: `daily-sales`, `monthly-sales`, `job-history-customer`, `job-history-serial`, `labour-profit`, `parts-profit`, `warranty-tracking`

## 🔑 Role-Based Access Control

- **admin**: Full access to all modules
- **technician**: Access to job cards and testing records (assigned jobs only)
- **storekeeper**: Access to inventory and customers

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL2** - MySQL driver with Promise support
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📝 Features

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Auto-generated job numbers (JC-001, JC-002, etc.)
- ✅ Auto-generated quotation numbers (QT-001, QT-002, etc.)
- ✅ Auto-generated invoice numbers (INV-001, INV-002, etc.)
- ✅ Auto-generated payment numbers (PAY-001, PAY-002, etc.)
- ✅ Parameterized SQL queries (SQL injection protection)
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Payment tracking with invoice status updates
- ✅ Inventory stock level monitoring
- ✅ Multiple report types

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Security

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- SQL injection protection (parameterized queries)
- CORS enabled for frontend
- Input validation on all endpoints

## 📄 License

ISC

## 👥 Support

For issues or questions, please contact the development team.

