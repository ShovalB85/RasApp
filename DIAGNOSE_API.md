# API Diagnosis Guide

## Current Status

✅ **Server is RUNNING** - Health endpoint works
❓ **Login endpoint** - Needs testing

## Quick Tests

### Test 1: Open Browser Test Page
Open `quick-api-test.html` in your browser - it has a full test interface.

### Test 2: Check Server Logs
Look at the server console (where you ran `npm run dev`) for any errors.

### Test 3: Test in Browser Console
Open browser console (F12) and run:

```javascript
// Test health
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test login
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ personalId: '8223283' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Common Issues

### Issue 1: Database Not Connected
**Check:** Look at server console for database errors

**Solution:**
```powershell
cd server
# Check .env file exists
# Make sure DATABASE_URL is set
npm run db:studio  # This will test connection
```

### Issue 2: User Not in Database
**Check:** The user might not exist in the database

**Solution:**
```powershell
cd server
npm run db:studio
# Check Soldier table for user with personalId = "8223283"
```

### Issue 3: API Mode Not Enabled in Frontend
**Check:** 
```javascript
localStorage.getItem('rassapp-use-api')
```

**Solution:**
Create `.env.local`:
```
VITE_USE_API=true
VITE_API_URL=http://localhost:3001/api
```

Or enable manually:
```javascript
localStorage.setItem('rassapp-use-api', 'true');
location.reload();
```

## Next Steps

1. **Open `quick-api-test.html`** in browser - easiest way to test
2. **Check server console** for detailed error messages
3. **Check database** - make sure users exist
4. **Verify API mode** is enabled in frontend

