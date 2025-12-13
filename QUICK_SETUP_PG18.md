# Quick Setup for PostgreSQL 18

Since you have PostgreSQL 18 installed, here are the exact steps:

## Step 1: Create Database (Choose One Method)

### Method A: Using the Helper Script (Easiest!)

Run this in PowerShell from the project root:
```powershell
.\CREATE_DATABASE_PG18.ps1
```

It will prompt you for your PostgreSQL password and create the database automatically.

### Method B: Manual PowerShell Command

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

Enter your password, then:
```sql
CREATE DATABASE rasapp;
\q
```

### Method C: Using pgAdmin

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name: `rasapp`
5. Click Save

## Step 2: Create .env File

Navigate to the `server` folder and create a `.env` file:

```powershell
cd server
```

Create `.env` with this content (replace YOUR_PASSWORD):
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="change-this-to-random-string-123456789"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
```

## Step 3: Install & Setup

```powershell
# Make sure you're in the server folder
cd server

# Install dependencies
npm install

# Generate Prisma client (connects to database)
npm run db:generate

# Create database tables
npm run db:migrate

# Add initial admin user
npm run db:seed
```

## Step 4: Start Server

```powershell
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
```

## Step 5: Test

Open browser: `http://localhost:3001/health`

You should see: `{"status":"ok",...}`

## Default Admin Account

After running `npm run db:seed`:
- **Personal ID:** `8223283`
- **Password:** `P)O(I*q1w2e3`

## Troubleshooting

**"Can't connect to database"**
- Make sure PostgreSQL service is running (Services → postgresql)
- Check password in .env file is correct
- Verify database `rasapp` exists

**"Module not found"**
- Run `npm install` in the server folder

## All Set!

Your app is now connected to PostgreSQL 18! 🎉

