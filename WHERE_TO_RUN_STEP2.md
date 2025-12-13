# Where to Create the .env File (Step 2)

## Location

Create the `.env` file **in the `server` folder**.

```
RasApp/
└── server/          ← Create .env file HERE
    ├── .env         ← This is where it should be
    ├── package.json
    ├── src/
    └── prisma/
```

## Current Location

You're already in the right place! Based on your terminal:
```
C:\Users\Home\Desktop\Projects\RasApp\server
```

This is exactly where the `.env` file needs to be created.

## How to Create It

### Option 1: Using the Helper Script (Easiest)

From the `server` folder, run:
```powershell
.\create-env.ps1
```

It will:
- Prompt for your PostgreSQL password
- Generate a random JWT secret
- Create the `.env` file automatically

### Option 2: Manual Creation

1. **Using your code editor:**
   - Create a new file in the `server` folder
   - Name it exactly: `.env` (with the dot at the beginning)
   - Paste this content (replace YOUR_PASSWORD):
   
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
   JWT_SECRET="change-this-to-random-string-123456789"
   PORT=3001
   HOST=0.0.0.0
   CORS_ORIGINS="*"
   ```

2. **Using PowerShell:**
   ```powershell
   # Make sure you're in the server folder
   cd C:\Users\Home\Desktop\Projects\RasApp\server
   
   # Create the file
   @"
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
   JWT_SECRET="random-secret-key-12345"
   PORT=3001
   HOST=0.0.0.0
   CORS_ORIGINS="*"
   "@ | Out-File -FilePath .env -Encoding utf8
   ```
   
   Then edit it and replace `YOUR_PASSWORD` with your actual password.

## Verify Location

To check you're in the right place:
```powershell
Get-Location
# Should show: C:\Users\Home\Desktop\Projects\RasApp\server

# Check if .env exists
Test-Path .env
# Should show: True (after creating it)
```

## Summary

✅ **Location:** `C:\Users\Home\Desktop\Projects\RasApp\server\.env`
✅ **You're already there!** Just create the file in your current directory.

The `.env` file must be in the `server` folder because that's where the backend application reads it from.

