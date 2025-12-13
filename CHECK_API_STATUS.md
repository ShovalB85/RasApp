# How to Check if API is Working

## Quick Tests

### 1. Check if Server is Running

Open PowerShell and run:
```powershell
.\test-api.ps1
```

Or manually test:
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

**Expected:** Should return JSON with `{"status":"ok"}`

### 2. Check in Browser

Open: http://localhost:3001/health

**Expected:** Should show JSON response

### 3. Check Frontend API Mode

Open browser console (F12) and run:
```javascript
// Check if API mode is enabled
localStorage.getItem('rassapp-use-api')

// Check if API URL is set
import.meta.env.VITE_API_URL

// Check if token exists
localStorage.getItem('rassapp-token')
```

### 4. Test Login Endpoint Directly

In PowerShell:
```powershell
$body = @{
    personalId = "8223283"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**Expected:** Should return JSON with either:
- `{"needsPassword": true, ...}` (if no password)
- `{"token": "...", "user": {...}}` (if has password)

## Common Issues

### Issue 1: Server Not Running
**Symptoms:**
- Connection refused errors
- "Cannot GET /health"

**Solution:**
```powershell
cd server
npm run dev
```

### Issue 2: API Mode Not Enabled
**Symptoms:**
- Frontend uses localStorage
- API calls don't happen

**Solution:**
Create `.env.local` in root:
```
VITE_API_URL=http://localhost:3001/api
VITE_USE_API=true
```

Or enable manually:
```javascript
localStorage.setItem('rassapp-use-api', 'true');
location.reload();
```

### Issue 3: Database Not Connected
**Symptoms:**
- Server runs but API calls fail
- Database connection errors in server logs

**Solution:**
1. Check `.env` file in `server/` directory
2. Verify `DATABASE_URL` is correct
3. Make sure PostgreSQL is running
4. Test connection:
   ```powershell
   cd server
   npm run db:studio
   ```

### Issue 4: CORS Errors
**Symptoms:**
- Browser console shows CORS errors
- API calls blocked

**Solution:**
Check `server/src/index.ts` - CORS should allow your frontend URL

## Full Diagnostic

Run this in browser console (F12):
```javascript
// 1. Check API mode
console.log('API Mode:', localStorage.getItem('rassapp-use-api'));
console.log('API URL:', import.meta.env.VITE_API_URL);

// 2. Test API connection
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err));

// 3. Test login
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ personalId: '8223283' })
})
  .then(r => r.json())
  .then(data => console.log('Login test:', data))
  .catch(err => console.error('Login test failed:', err));
```

## Expected Results

✅ **Everything Working:**
- Server responds to `/health`
- Login endpoint returns JSON
- Frontend can connect to API
- No CORS errors

❌ **Not Working:**
- Connection refused
- 404 errors
- CORS errors
- Database errors

