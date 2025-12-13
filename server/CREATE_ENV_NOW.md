# Create .env File Now!

## The Problem
Prisma needs the `.env` file to find your database connection. Without it, you get:
```
Error: Environment variable not found: DATABASE_URL
```

## Solution: Create .env File

### Method 1: Run the Script (Easiest!)
```powershell
.\create-env.ps1
```
Enter your PostgreSQL password when prompted.

### Method 2: Create Manually

**Location:** `C:\Users\Home\Desktop\Projects\RasApp\server\.env`

**Content:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="random-secret-key-12345"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
```

**IMPORTANT:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

### Method 3: PowerShell One-Liner

Replace `YOUR_PASSWORD` and run:
```powershell
'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="random-secret-key-12345"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"' | Out-File -FilePath .env -Encoding utf8
```

## Verify

After creating, check:
```powershell
Get-Content .env
```

Should show your database connection string.

## Then Continue

After creating `.env`, run:
```powershell
npm run db:migrate
```

