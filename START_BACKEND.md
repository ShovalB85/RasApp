# 🚀 How to Start the Backend Server

## Problem: Can't Login - Server Not Running

The login error `ERR_CONNECTION_REFUSED` means the backend server is not running.

## Solution: Start the Server

### Step 1: Open a NEW Terminal/PowerShell Window

**Important:** Keep this terminal window open! The server needs to keep running.

### Step 2: Navigate to Server Directory

```powershell
cd C:\Users\Home\Desktop\Projects\RasApp\server
```

### Step 3: Start the Server

```powershell
npm run dev
```

### Step 4: Wait for Server to Start

You should see output like:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://192.168.x.x:3001
```

**✅ Success!** The server is now running.

### Step 5: Go Back to Browser and Try Login Again

1. Go back to your browser
2. Refresh the page (F5)
3. Try logging in with:
   - Personal ID: `8223283`
   - Password: (your password)

## Verify Server is Running

### Check 1: Look at Terminal
Should show "Server running" message

### Check 2: Test Health Endpoint
Open in browser: **http://localhost:3001/health**

Should show: `{"status":"ok",...}`

### Check 3: Check Port
In another terminal:
```powershell
netstat -ano | findstr :3001
```

Should show a process listening on port 3001.

## Common Issues

### "Port 3001 already in use"
- Another server is already running
- Either use that one, or kill it:
  ```powershell
  # Find process
  netstat -ano | findstr :3001
  # Kill it (replace PID with the number)
  taskkill /PID <PID> /F
  ```

### "Cannot find module"
- Run: `npm install` in the server directory

### "Database connection error"
- Check that PostgreSQL is running
- Verify `.env` file has correct `DATABASE_URL`
- Check that database `rasapp` exists

### "EADDRINUSE: address already in use :::3001"
- Port 3001 is already in use
- Kill the existing process (see above)

## Keep Server Running

⚠️ **Important:** 
- **Keep the terminal window open!**
- If you close it, the server stops
- You can minimize it, but don't close it!

## Quick Start Command

Copy and paste this entire command into PowerShell:

```powershell
cd C:\Users\Home\Desktop\Projects\RasApp\server; npm run dev
```

Then wait for "Server running" message before trying to login!



