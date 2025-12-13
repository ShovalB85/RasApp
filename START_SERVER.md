# 🚨 IMPORTANT: Start the Server!

## The Problem

You're getting CORS errors because **the backend server is NOT running**.

The error "Failed to fetch" and CORS errors happen when the server isn't running to respond to requests.

## Solution: Start the Server

### Step 1: Open a Terminal

Open a **NEW** terminal window (or PowerShell).

### Step 2: Navigate to Server Directory

```powershell
cd C:\Users\Home\Desktop\Projects\RasApp\server
```

### Step 3: Start the Server

```powershell
npm run dev
```

### Step 4: Wait for Server to Start

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://...
```

**Keep this terminal open!** The server needs to keep running.

### Step 5: Try Again

Once the server is running:
- Go back to your browser
- Try adding a soldier
- Try logging in
- Should work now! ✅

## How to Know Server is Running

**Check 1:** Look at the terminal - should show "Server running"

**Check 2:** Open in browser: http://localhost:3001/health
- Should show: `{"status":"ok",...}`

**Check 3:** Check if port is in use:
```powershell
netstat -ano | findstr :3001
```

## Common Issues

### "Port 3001 already in use"
- Another server is already running
- Either use that one, or kill it:
  ```powershell
  # Find process using port 3001
  netstat -ano | findstr :3001
  # Kill it (replace PID with the number from above)
  taskkill /PID <PID> /F
  ```

### "Cannot find module"
- Run: `cd server && npm install`

### "Database connection error"
- Make sure PostgreSQL is running
- Check `.env` file has correct `DATABASE_URL`

## Keep Server Running

⚠️ **Important:** Keep the server terminal window open. If you close it, the server stops and you'll get errors again.

You can minimize it, but don't close it!

