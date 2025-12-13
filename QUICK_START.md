# Quick Start Guide - Local Server for Mobile Access

Get your RasApp server running locally and accessible to mobile devices in 5 minutes!

## Prerequisites
- Node.js installed
- PostgreSQL installed locally
- ngrok account (free): https://ngrok.com

## Step-by-Step Setup

### 1. Install PostgreSQL & Create Database

**Windows:**
```powershell
# Download and install from: https://www.postgresql.org/download/windows/
# Then create database:
psql -U postgres
CREATE DATABASE rasapp;
\q
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb rasapp
```

### 2. Setup Backend

```bash
cd server
npm install

# Create .env file
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="change-this-to-random-string-12345"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"' > .env

# Replace YOUR_PASSWORD with your PostgreSQL password

# Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3. Start Server

```bash
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://192.168.x.x:3001
```

### 4. Expose to Internet with ngrok

**In a new terminal:**

```bash
# Install ngrok (if not installed)
# Windows: choco install ngrok
# macOS: brew install ngrok

# Sign up and get authtoken from https://dashboard.ngrok.com
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Start tunnel
ngrok http 3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### 5. Configure Frontend/Mobile Apps

**For Web App:**
Create `.env.local`:
```env
VITE_API_URL=https://abc123.ngrok.io/api
VITE_USE_API=true
```

**For Mobile Apps:**
Set API base URL to: `https://abc123.ngrok.io/api`

### 6. Test

1. **Test health endpoint:**
   - Visit: `https://abc123.ngrok.io/health`
   - Should return: `{"status":"ok",...}`

2. **Test login:**
   - Personal ID: `8223283`
   - Password: `P)O(I*q1w2e3`

## Default Admin Account

After running `npm run db:seed`:
- **Personal ID:** `8223283`
- **Password:** `P)O(I*q1w2e3`
- **Role:** Admin

## Troubleshooting

**Server won't start:**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Ensure database `rasapp` exists

**Can't access from mobile:**
- Verify ngrok is running
- Check ngrok URL is HTTPS (not HTTP)
- Ensure server shows "Network: http://..." in console

**CORS errors:**
- Set `CORS_ORIGINS="*"` in `.env` for development

## Next Steps

- See `LOCAL_SETUP.md` for detailed instructions
- See `MIGRATION_GUIDE.md` for deployment options
- Configure firewall if using port forwarding instead of ngrok

## Keeping Server Running

**Option 1:** Keep terminal open

**Option 2:** Use PM2 (recommended for production):
```bash
npm install -g pm2
pm2 start npm --name "rasapp" -- run dev
pm2 save
```

Your server is now accessible from anywhere! 🎉


