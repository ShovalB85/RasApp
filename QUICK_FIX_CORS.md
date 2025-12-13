# Quick Fix for CORS Error

## The Issue

You're still getting:
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

## What I Fixed

✅ Updated CORS configuration in `server/src/index.ts`
✅ Added explicit OPTIONS handler
✅ Improved headers handling

## What You Need to Do

### Step 1: Make Sure Server is Running

**Check if server is running:**
1. Look for a terminal window showing "🚀 Server running"
2. OR open: http://localhost:3001/health
   - Should show JSON response
   - If error → server is NOT running

**If server is NOT running:**
```powershell
# Open new terminal
cd C:\Users\Home\Desktop\Projects\RasApp\server
npm run dev
```

**Wait until you see:**
```
🚀 Server running:
   Local:   http://localhost:3001
```

### Step 2: Restart Server with New CORS Config

**If server IS running, restart it:**

1. Go to terminal where server is running
2. Press `Ctrl+C` to stop it
3. Start it again:
   ```powershell
   npm run dev
   ```

### Step 3: Clear Browser Cache

After restarting server:
1. Open browser console (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"
4. OR press `Ctrl+Shift+R`

### Step 4: Try Again

After server restart and cache clear:
- Try adding a soldier
- Try logging in
- Should work now! ✅

## Still Not Working?

### Check 1: Verify Server is Running
Open: http://localhost:3001/health
- ✅ Shows JSON → Server is running
- ❌ Error → Server is NOT running

### Check 2: Verify CORS Headers
Open browser console (F12) → Network tab:
1. Try adding a soldier
2. Find the failed request
3. Check Response Headers
4. Should see: `Access-Control-Allow-Origin: *`

### Check 3: Check Server Console
Look at server terminal for any errors when you try to add soldier.

## Alternative: Test Directly

If still having issues, test the API directly:

```powershell
# Test OPTIONS request
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method OPTIONS

# Test POST request  
$body = @{ personalId = "8223283" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

Both should work without errors if server is configured correctly.

