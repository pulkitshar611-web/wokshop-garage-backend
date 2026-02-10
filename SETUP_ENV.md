# .env File Setup - IMPORTANT!

## ⚠️ Problem
अगर आपको error दिख रहा है: `JWT_SECRET is not configured in .env file`

तो `.env` file create करनी होगी।

## ✅ Solution

### Option 1: Automatic (Recommended)
```bash
cd workshop-backend
node create-env.js
```

### Option 2: Manual Creation

1. `workshop-backend` folder में जाएं
2. `.env` नाम की file create करें (कोई extension नहीं)
3. नीचे दिया content copy-paste करें:

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

4. **Important:** `DB_PASSWORD=` में अपना MySQL password डालें

### Option 3: Using PowerShell (Windows)
```powershell
cd workshop-backend
@"
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
"@ | Out-File -FilePath .env -Encoding utf8
```

## 🔍 Verify .env File

File create करने के बाद verify करें:

```bash
cd workshop-backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ NOT FOUND');"
```

अगर "✅ Found" दिखे तो file सही है।

## 🔄 After Creating .env File

1. Server restart करें:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. Login test करें:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"admin@workshop.com\",\"password\":\"password123\"}"
   ```

## 📝 Notes

- `.env` file `workshop-backend` folder में होनी चाहिए
- File name exactly `.env` होनी चाहिए (कोई extension नहीं)
- `JWT_SECRET` production में change करें
- `.env` file को git में commit न करें (already in .gitignore)

