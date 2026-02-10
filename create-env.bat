@echo off
echo Creating .env file...

(
echo # Server Configuration
echo PORT=8000
echo NODE_ENV=development
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=workshop_db
echo DB_PORT=3306
echo.
echo # JWT Configuration
echo JWT_SECRET=workshop-management-secret-key-2025-change-in-production
echo JWT_EXPIRES_IN=7d
) > .env

echo.
echo ✅ .env file created successfully!
echo.
echo ⚠️  IMPORTANT: Update DB_PASSWORD with your MySQL password in .env file
echo.
pause

