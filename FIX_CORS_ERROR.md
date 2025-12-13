# Fixing CORS Error

## The Problem

You're seeing this error:
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access 
control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This happens when:
- Frontend (localhost:3000) tries to call API (localhost:3001)
- Browser sends a preflight OPTIONS request
- Server doesn't respond correctly to the OPTIONS request

## The Fix

I've updated the server CORS configuration in `server/src/index.ts`:

1. ✅ Added explicit OPTIONS handler
2. ✅ Improved CORS headers configuration
3. ✅ Added more allowed headers
4. ✅ Set proper optionsSuccessStatus

## Apply the Fix

**You MUST restart the server for changes to take effect:**

1. **Stop the server:**
   - Go to the terminal where server is running
   - Press `Ctrl+C` to stop it

2. **Start the server again:**
   ```powershell
   cd server
   npm run dev
   ```

3. **Test again:**
   - Try adding a soldier
   - Try logging in
   - Should work now!

## Verify the Fix

After restarting, check server console. You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://...
```

Then try your operations again - the CORS errors should be gone!

## If Still Not Working

1. **Check server is running** on port 3001
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh** the page (Ctrl+F5)
4. **Check browser console** for any new errors

The CORS configuration should now properly handle all requests from localhost:3000!

