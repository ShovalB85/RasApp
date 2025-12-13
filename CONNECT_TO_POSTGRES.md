# Quick Guide: Connect App to PostgreSQL

## What You Need to Do

### 1. Create the Database

Open PowerShell and run:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```
*(Adjust version number if needed: 15, 16, 17, or 18)*

Enter your PostgreSQL password when prompted.

Then run:
```sql
CREATE DATABASE rasapp;
\q
```

### 2. Create .env File

Go to the `server` folder and create a file named `.env` with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="change-this-to-random-string-123456789"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
```

**Replace `YOUR_PASSWORD`** with your actual PostgreSQL password!

### 3. Run Setup Script (Easiest Way)

In PowerShell, navigate to the server folder and run:
```powershell
cd server
.\setup-database.ps1
```

This script will:
- ✅ Create .env file (asks for your password)
- ✅ Install dependencies
- ✅ Generate Prisma client
- ✅ Create database tables
- ✅ Add initial admin user

### 4. Or Do It Manually

If you prefer manual setup:

```powershell
cd server

# Install dependencies
npm install

# Create .env file (edit it first with your password!)
# Then continue:

# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:migrate

# Add initial data
npm run db:seed
```

### 5. Start the Server

```powershell
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
```

### 6. Test It

Open browser: `http://localhost:3001/health`

Or in PowerShell:
```powershell
curl http://localhost:3001/health
```

## Troubleshooting

**Can't find psql?**
- Try: `C:\Program Files\PostgreSQL\16\bin\psql.exe` (if you have version 16)
- Or use pgAdmin GUI tool

**Connection error?**
- Check PostgreSQL service is running (Services → postgresql)
- Verify password in .env file is correct
- Make sure database `rasapp` exists

**Still having issues?**
- See `POSTGRESQL_CONNECTION_STEPS.md` for detailed troubleshooting

## Summary

1. ✅ Create database: `CREATE DATABASE rasapp;`
2. ✅ Create `.env` file with your PostgreSQL password
3. ✅ Run `npm install` in server folder
4. ✅ Run `npm run db:generate`
5. ✅ Run `npm run db:migrate`
6. ✅ Run `npm run db:seed`
7. ✅ Start server: `npm run dev`

Done! Your app is now connected to PostgreSQL! 🎉

