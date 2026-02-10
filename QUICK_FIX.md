# Quick Fix: JWT_SECRET Error

## 🚨 Problem
Server crash हो रहा है: `JWT_SECRET is not configured in .env file`

## ✅ Solution (Choose One)

### Method 1: Run Batch File (Windows - Easiest)
```bash
cd workshop-backend
create-env.bat
```

### Method 2: Run Node Script
```bash
cd workshop-backend
node create-env.js
```

### Method 3: Manual Creation

1. `workshop-backend` folder में जाएं
2. `.env` नाम की file बनाएं (कोई extension नहीं)
3. नीचे का content copy करें:

```
PORT=8000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=workshop_db
DB_PORT=3306
JWT_SECRET=workshop-management-secret-key-2025-change-in-production
JWT_EXPIRES_IN=7d
```

4. File save करें

### Method 4: PowerShell Command
```powershell
cd workshop-backend
@"
PORT=8000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=workshop_db
DB_PORT=3306
JWT_SECRET=workshop-management-secret-key-2025-change-in-production
JWT_EXPIRES_IN=7d
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline
```

## 🔍 Verify

File create करने के बाद verify करें:
```bash
cd workshop-backend
node check-env.js
```

अगर "✅ Environment variables loaded successfully!" दिखे तो सही है।

## 🔄 Restart Server

`.env` file create करने के बाद:

1. Server restart करें (nodemon automatically restart करेगा)
2. या manually:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

## ✅ Success Indicators

Server start होने पर ये messages दिखने चाहिए:
- ✅ Server running on port 8000
- ✅ Database connected successfully
- ❌ JWT_SECRET error नहीं दिखनी चाहिए

## 📝 Important Notes

- `.env` file `workshop-backend` folder में होनी चाहिए
- File name exactly `.env` होनी चाहिए (कोई extension नहीं)
- `DB_PASSWORD=` में अपना MySQL password डालें
- Production में `JWT_SECRET` change करें

