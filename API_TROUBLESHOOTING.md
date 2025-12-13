# API Troubleshooting Guide

## Current Status

Based on the test page results:
- ❌ "Failed to fetch" errors
- ⚠️ API Mode: NOT SET

## Step-by-Step Fix

### Step 1: Verify Server is Running

**Check 1:** Look at the terminal where you ran `cd server && npm run dev`
- Should see: `Server running on http://localhost:3001`
- If not, start it:
  ```powershell
  cd server
  npm run dev
  ```

**Check 2:** Open in browser: http://localhost:3001/health
- Should show: `{"status":"ok","timestamp":"...","server":"RasApp API","version":"1.0.0"}`
- If you get "connection refused" or error → Server is NOT running

### Step 2: Fix "Failed to fetch" Error

This error means the browser can't connect to the server. Common causes:

#### Cause A: Server Not Running
**Solution:** Start the server (see Step 1)

#### Cause B: HTML File Opened Directly (file://)
**Problem:** Opening `quick-api-test.html` directly from file system causes CORS issues

**Solution:** Serve it through a web server:
```powershell
# Option 1: Use the frontend dev server
# The file should be accessible at:
# http://localhost:3000/quick-api-test.html

# Option 2: Use Python's simple server
cd C:\Users\Home\Desktop\Projects\RasApp
python -m http.server 8080
# Then open: http://localhost:8080/quick-api-test.html

# Option 3: Just test in browser console (F12)
```

#### Cause C: Wrong URL
**Check:** Make sure server is on port 3001
- Check server console output
- Check `.env` file in `server/` directory

### Step 3: Enable API Mode

**Option A: Restart Frontend (Best)**
1. Stop frontend server (Ctrl+C)
2. Restart: `npm run dev`
3. Refresh browser
4. Check test page again

**Option B: Enable Manually**
1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.setItem('rassapp-use-api', 'true')
   localStorage.setItem('rassapp-api-url', 'http://localhost:3001/api')
   location.reload()
   ```

### Step 4: Test Again

After fixing the above:
1. Refresh the test page
2. Click "Test /health" - should work
3. Click "Check Config" - should show API Mode enabled
4. Click "Test Login" - should work

## Quick Diagnostic Commands

**In PowerShell:**
```powershell
# Test server directly
Invoke-WebRequest -Uri "http://localhost:3001/health"

# Test login
$body = @{ personalId = "8223283" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**In Browser Console (F12):**
```javascript
// Test server
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('Server not accessible:', e));

// Check API mode
console.log('API Mode:', localStorage.getItem('rassapp-use-api'));

// Enable API mode
localStorage.setItem('rassapp-use-api', 'true');
location.reload();
```

## Expected Results After Fix

✅ Health check works
✅ Login test works  
✅ API Mode: Enabled
✅ No "Failed to fetch" errors

## Still Having Issues?

1. **Check server console** for errors
2. **Check browser console** (F12) for detailed error messages
3. **Verify database is connected** (look at server logs)
4. **Check firewall** - make sure port 3001 is not blocked

