# ✅ .env File Setup - Complete Guide

## 🎯 Current Status

Your `server.js` has validation that checks for `JWT_SECRET` on startup. This is **good security practice**!

## 📋 Step-by-Step Setup

### Step 1: Create .env File

**Option A: Using Script (Recommended)**
```bash
cd workshop-backend
node create-env.js
```

**Option B: Using Batch File (Windows)**
```bash
cd workshop-backend
create-env.bat
```

**Option C: Manual Creation**
1. Go to `workshop-backend` folder
2. Create new file named `.env` (no extension)
3. Copy-paste this content:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=workshop_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=workshop-management-secret-key-2025-change-in-production
JWT_EXPIRES_IN=7d
```

### Step 2: Update MySQL Password

Open `.env` file and update:
```env
DB_PASSWORD=your_actual_mysql_password_here
```

### Step 3: Verify Setup

Run verification script:
```bash
cd workshop-backend
node check-env.js
```

Expected output:
```
✅ .env file exists
✅ JWT_SECRET is configured
✅ DB_NAME is configured
✅ Environment variables loaded successfully!
```

### Step 4: Restart Server

Nodemon will auto-restart, or manually:
```bash
# In nodemon, type 'rs' to restart
# Or stop (Ctrl+C) and run: npm run dev
```

## ✅ Success Indicators

After creating `.env` file, you should see:
```
🚀 Server running on port 8000
📡 API available at http://localhost:8000/api
🏥 Health check: http://localhost:8000/health
✅ Database connected successfully
```

**NO error messages about JWT_SECRET!**

## 🔒 Security Notes

1. ✅ `.env` is already in `.gitignore` (won't be committed to Git)
2. ⚠️ Change `JWT_SECRET` in production to a strong random string
3. ⚠️ Never commit `.env` file to version control
4. ⚠️ Keep `JWT_SECRET` secret and secure

## 🧪 Test Login

After server starts successfully, test login:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@workshop.com\",\"password\":\"password123\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@workshop.com",
    "role": "admin"
  }
}
```

## 🐛 Troubleshooting

### Error: "JWT_SECRET is not configured"
- ✅ Solution: Run `node create-env.js`
- ✅ Verify: Run `node check-env.js`

### Error: "Database connection failed"
- Check MySQL is running
- Verify `DB_PASSWORD` in `.env` file
- Verify database `workshop_db` exists

### Server not restarting
- Stop server (Ctrl+C)
- Run `npm run dev` again
- Or type `rs` in nodemon terminal

## 📁 File Structure

```
workshop-backend/
├── .env                    ← Create this file!
├── .gitignore             ← Already includes .env
├── create-env.js          ← Script to create .env
├── create-env.bat         ← Windows batch file
├── check-env.js           ← Verification script
├── server.js              ← Validates JWT_SECRET
└── ...
```

## ✅ Checklist

- [ ] `.env` file created in `workshop-backend` folder
- [ ] `JWT_SECRET` is set in `.env`
- [ ] `DB_PASSWORD` updated with MySQL password
- [ ] Verified with `node check-env.js`
- [ ] Server restarted successfully
- [ ] No JWT_SECRET errors
- [ ] Login test successful

## 🎉 Done!

Once `.env` file is created and server restarts without errors, you're all set!

Your API is ready to use. Test with Postman collection or frontend.

