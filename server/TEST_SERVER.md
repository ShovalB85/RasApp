# Test Your Server Setup

Follow these steps to test if everything is working:

## Step 1: Seed the Database

First, add the initial admin user:
```powershell
npm run db:seed
```

This creates:
- Default misgeret: "מטה כללי"
- Admin user:
  - Personal ID: `8223283`
  - Password: `P)O(I*q1w2e3`

## Step 2: Start the Server

```powershell
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://192.168.x.x:3001
```

## Step 3: Test the Connection

### Test 1: Health Check

**Option A: Browser**
- Open: `http://localhost:3001/health`
- Should show: `{"status":"ok","timestamp":"...","server":"RasApp API","version":"1.0.0"}`

**Option B: PowerShell**
```powershell
curl http://localhost:3001/health
```

### Test 2: Login Test

**Using PowerShell:**
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"personalId":"8223283","password":"P)O(I*q1w2e3"}'
```

Should return a JWT token and user info.

**Using Browser (with extension like REST Client):**
```json
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "personalId": "8223283",
  "password": "P)O(I*q1w2e3"
}
```

## Expected Results

✅ **Health check** returns: `{"status":"ok",...}`  
✅ **Login** returns: `{"token":"...","user":{...}}`  
✅ **Server** stays running without errors

## Troubleshooting

**"Cannot connect to database"**
- Check PostgreSQL service is running
- Verify DATABASE_URL in .env is correct
- Check database `rasapp` exists

**"Port 3001 already in use"**
- Another process is using port 3001
- Change PORT in .env to something else (e.g., 3002)
- Or stop the other process

**"Module not found" errors**
- Run `npm install` again
- Check you're in the `server` folder

## Next Steps

Once everything works:
1. ✅ Server running
2. ✅ Database connected
3. ✅ API responding
4. 🔄 Next: Connect frontend or expose to internet (see LOCAL_SETUP.md)

