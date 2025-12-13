# Fixing API Connection Issues

## Current Problems

1. ❌ **"Failed to fetch"** errors in browser
2. ⚠️ **API Mode not enabled** in frontend

## Solutions

### Fix 1: Enable API Mode

**Option A: Restart Frontend (Recommended)**
```powershell
# Stop the frontend server (Ctrl+C)
# Then restart it:
npm run dev
```

**Option B: Enable Manually**
1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.setItem('rassapp-use-api', 'true')
   localStorage.setItem('rassapp-api-url', 'http://localhost:3001/api')
   location.reload()
   ```

### Fix 2: Fix "Failed to fetch" Error

This error happens when:
- Server is not running
- CORS is blocking the request
- Wrong URL

**Check if server is running:**
1. Open: http://localhost:3001/health
2. Should show: `{"status":"ok",...}`

**If server is running but still getting errors:**

The server should already allow CORS from all origins. If still having issues:

1. Check server is running on correct port:
   ```powershell
   cd server
   npm run dev
   ```
   Should show: `Server running on http://localhost:3001`

2. Check browser console for detailed error (F12)

3. Try accessing API directly:
   - http://localhost:3001/health
   - http://localhost:3001/

### Fix 3: Test Connection

**In Browser:**
1. Open: http://localhost:3001/health
2. Should see JSON response

**In PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

**In Browser Console (F12):**
```javascript
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Quick Diagnostic

Run this in browser console (F12):

```javascript
// Test 1: Check server accessibility
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log('✅ Server accessible:', d))
  .catch(e => console.error('❌ Server not accessible:', e));

// Test 2: Check API mode
console.log('API Mode:', localStorage.getItem('rassapp-use-api'));

// Test 3: Test login endpoint
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ personalId: '8223283' })
})
  .then(r => r.json())
  .then(d => console.log('✅ Login endpoint:', d))
  .catch(e => console.error('❌ Login failed:', e));
```

## Expected Results

✅ **Everything Working:**
- Server accessible at http://localhost:3001/health
- API mode enabled in frontend
- No "Failed to fetch" errors
- Login endpoint responds correctly

## Common Issues

### Issue: Server Not Running
**Fix:** Start the server
```powershell
cd server
npm run dev
```

### Issue: Wrong Port
**Check:** Server should be on port 3001
**Fix:** Check server console output

### Issue: CORS Blocking
**Fix:** Server already configured to allow all origins. If still blocking, check browser console for specific error.

### Issue: API Mode Not Enabled
**Fix:** Enable via `.env.local` or `localStorage` (see Fix 1 above)

