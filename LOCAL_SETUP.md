# Local Server Setup for Mobile Access

This guide will help you set up the RasApp server on your local computer and make it accessible to mobile devices (Android/Apple) over the internet.

## Architecture

```
┌─────────────────┐         Internet          ┌──────────────┐
│  Mobile Device  │ ─────────────────────────> │  Your PC     │
│  (Android/iOS)  │                            │  (localhost) │
└─────────────────┘                            └──────────────┘
                                                      │
                                                      ▼
                                                ┌──────────────┐
                                                │  PostgreSQL  │
                                                │  (local DB)   │
                                                └──────────────┘
```

## Step 1: Install PostgreSQL Locally

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. PostgreSQL will run on `localhost:5432`

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database

Open PostgreSQL command line (psql) or pgAdmin:

```sql
CREATE DATABASE rasapp;
```

Or via command line:
```bash
psql -U postgres
CREATE DATABASE rasapp;
\q
```

## Step 3: Configure Backend Server

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   # Windows (PowerShell)
   New-Item .env
   
   # macOS/Linux
   touch .env
   ```

4. **Edit `.env` file with this content:**
   ```env
   # Database (local PostgreSQL)
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"
   
   # Server Configuration
   PORT=3001
   HOST=0.0.0.0
   
   # CORS - Allow all origins for mobile (or specify your ngrok URL)
   CORS_ORIGINS="*"
   ```

   **Replace `YOUR_PASSWORD`** with your PostgreSQL password.

5. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

## Step 4: Start Local Server

```bash
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://YOUR_LOCAL_IP:3001
   External: Configure port forwarding or use ngrok
```

## Step 5: Expose Server to Internet

You have several options to make your local server accessible from mobile devices:

### Option A: ngrok (Easiest - Recommended)

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Or via package manager:
     ```bash
     # Windows (chocolatey)
     choco install ngrok
     
     # macOS
     brew install ngrok
     ```

2. **Sign up for free account:**
   - Go to https://dashboard.ngrok.com/signup
   - Get your authtoken

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Start ngrok tunnel:**
   ```bash
   ngrok http 3001
   ```

5. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

6. **Update frontend/mobile apps** to use this URL:
   ```
   API_URL=https://abc123.ngrok.io/api
   ```

**Note:** Free ngrok URLs change each time you restart. For a fixed URL, upgrade to a paid plan or use Option B.

### Option B: Port Forwarding (Fixed IP)

1. **Find your public IP:**
   - Visit: https://whatismyipaddress.com/
   - Note your public IP address

2. **Configure Router Port Forwarding:**
   - Access your router admin panel (usually `192.168.1.1` or `192.168.0.1`)
   - Go to Port Forwarding / Virtual Server settings
   - Add rule:
     - External Port: `3001` (or any port you prefer)
     - Internal IP: Your computer's local IP (from `ipconfig` / `ifconfig`)
     - Internal Port: `3001`
     - Protocol: TCP

3. **Configure Windows Firewall:**
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "RasApp Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

4. **Use your public IP:**
   ```
   API_URL=http://YOUR_PUBLIC_IP:3001/api
   ```

**Note:** Your public IP may change. Consider using a Dynamic DNS service (like No-IP or DuckDNS).

### Option C: Cloudflare Tunnel (Free & Permanent)

1. **Install cloudflared:**
   - Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

2. **Create tunnel:**
   ```bash
   cloudflared tunnel create rasapp
   ```

3. **Run tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

4. **Use the provided URL** (permanent and free)

## Step 6: Configure Mobile Apps

### For Web App (React)
Update `.env.local`:
```env
VITE_API_URL=https://your-ngrok-url.ngrok.io/api
VITE_USE_API=true
```

### For Native Mobile Apps
Set the API base URL in your app configuration:
- **Android**: Update `strings.xml` or `build.gradle`
- **iOS**: Update `Info.plist` or environment variables

Example:
```javascript
const API_BASE_URL = 'https://your-ngrok-url.ngrok.io/api';
```

## Step 7: Test Connection

1. **Test from your computer:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test from mobile device:**
   - Open browser on phone
   - Visit: `https://your-ngrok-url.ngrok.io/health`
   - Should see: `{"status":"ok",...}`

3. **Test API endpoint:**
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"personalId":"8223283","password":"P)O(I*q1w2e3"}'
   ```

## Security Considerations

1. **Use HTTPS:** Always use ngrok HTTPS URLs or set up SSL certificate
2. **Strong JWT Secret:** Use a long, random string for `JWT_SECRET`
3. **Firewall Rules:** Only allow necessary ports
4. **Rate Limiting:** Consider adding rate limiting for production
5. **Authentication:** All endpoints require authentication except `/api/auth/login`

## Troubleshooting

### Server not accessible from mobile
- Check Windows Firewall allows port 3001
- Verify router port forwarding is correct
- Ensure server is listening on `0.0.0.0` (not just `localhost`)

### Database connection errors
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` is correct
- Ensure database `rasapp` exists

### CORS errors
- Update `CORS_ORIGINS` in `.env` to include your ngrok URL
- Or set to `*` for development (not recommended for production)

## Keeping Server Running

### Option 1: Run in Terminal
Keep the terminal window open while server is running.

### Option 2: Windows Service (Production)
Use `node-windows` or `pm2` to run as a service:
```bash
npm install -g pm2
pm2 start npm --name "rasapp-server" -- run dev
pm2 save
pm2 startup
```

### Option 3: Background Process
```bash
# Windows
start /B npm run dev

# macOS/Linux
nohup npm run dev &
```

## Next Steps

1. ✅ Server running locally
2. ✅ Database configured
3. ✅ Exposed to internet (ngrok/port forwarding)
4. ✅ Mobile apps configured with API URL
5. ✅ Test connection from mobile device

Your app is now ready for multi-user access from mobile devices!


