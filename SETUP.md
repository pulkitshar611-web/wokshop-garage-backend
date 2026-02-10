# Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following content:
```env
PORT=8000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=workshop_db
DB_PORT=3306

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Important**: Replace `your_mysql_password` with your actual MySQL root password.

### 3. Create Database
Run the SQL schema file to create the database and tables:
```bash
mysql -u root -p < database/schema.sql
```

Or manually:
1. Open MySQL command line or MySQL Workbench
2. Run the contents of `database/schema.sql`

### 4. Seed Admin User
Create the default admin user with proper password hash:
```bash
node database/seed.js
```

This will create an admin user with:
- **Email**: `admin@workshop.com`
- **Password**: `password123`

### 5. Start the Server
```bash
npm run dev
```

The API will be available at `http://localhost:8000/api`

### 6. Test the API
You can test the health endpoint:
```bash
curl http://localhost:8000/health
```

Or test login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@workshop.com","password":"password123"}'
```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check `.env` file has correct database credentials
- Ensure database `workshop_db` exists

### Port Already in Use
- Change `PORT` in `.env` file to a different port (e.g., 8001)
- Or stop the process using port 8000

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### Admin User Not Created
- Run `node database/seed.js` manually
- Check database connection in seed.js
- Verify users table exists

## Next Steps

1. Update frontend `.env` to point to this backend:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

2. Test all endpoints using Postman or curl

3. Create additional users via the admin panel

## API Base URL
All API endpoints are prefixed with `/api`:
- Login: `POST /api/auth/login`
- Users: `GET /api/users`, etc.
- Customers: `GET /api/customers`, etc.

See `README.md` for complete API documentation.

