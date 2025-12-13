# Step-by-Step: Connect App to PostgreSQL

Follow these steps in order to connect your RasApp to PostgreSQL.

## Step 1: Create the Database

Open PowerShell or Command Prompt and run:

```powershell
# Find PostgreSQL installation path (usually one of these)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
# OR
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

When prompted, enter the password you set during PostgreSQL installation.

Once connected (you'll see `postgres=#`), run:
```sql
CREATE DATABASE rasapp;
\q
```

**Alternative: Using pgAdmin (GUI)**
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your server
3. Right-click "Databases" → Create → Database
4. Name: `rasapp`
5. Click Save

## Step 2: Navigate to Server Directory

```powershell
cd server
```

## Step 3: Create .env File

Create a file named `.env` in the `server` folder with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-to-something-random"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
```

**IMPORTANT:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

**How to create the file:**
- Option 1: Use your code editor to create `server/.env`
- Option 2: In PowerShell (run from `server` folder):
  ```powershell
  @"
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
  JWT_SECRET="your-super-secret-jwt-key-change-this-to-something-random"
  PORT=3001
  HOST=0.0.0.0
  CORS_ORIGINS="*"
  "@ | Out-File -FilePath .env -Encoding utf8
  ```
  (Remember to replace YOUR_PASSWORD!)

## Step 4: Install Backend Dependencies

```powershell
cd server
npm install
```

## Step 5: Generate Prisma Client

```powershell
npm run db:generate
```

This creates the database client code based on the schema.

## Step 6: Run Database Migrations

```powershell
npm run db:migrate
```

This creates all the tables in your database.

## Step 7: Seed Initial Data

```powershell
npm run db:seed
```

This creates the default admin user:
- Personal ID: `8223283`
- Password: `P)O(I*q1w2e3`

## Step 8: Start the Server

```powershell
npm run dev
```

You should see:
```
🚀 Server running:
   Local:   http://localhost:3001
   Network: http://192.168.x.x:3001
```

## Step 9: Test the Connection

Open a new terminal and test:

```powershell
curl http://localhost:3001/health
```

Or visit in browser: `http://localhost:3001/health`

You should see: `{"status":"ok",...}`

## Troubleshooting

### "Can't find psql command"
- Use full path: `C:\Program Files\PostgreSQL\15\bin\psql.exe -U postgres`
- Or use pgAdmin GUI tool

### "Authentication failed"
- Check your password is correct
- Try: `psql -U postgres -h localhost`

### "Connection refused" or "Database does not exist"
- Make sure PostgreSQL service is running:
  - Open Services (Win+R → `services.msc`)
  - Find "postgresql" service
  - Make sure it's "Running"
- Verify database name is `rasapp` (lowercase)

### "Error: P1001: Can't reach database server"
- Check DATABASE_URL in `.env` is correct
- Verify PostgreSQL is running
- Try connecting manually: `psql -U postgres -d rasapp`

### "Module not found" errors
- Make sure you ran `npm install` in the `server` directory
- Check you're in the `server` folder

## Verify Connection

After starting the server, you should see no database connection errors. If you see errors, check:

1. PostgreSQL service is running
2. `.env` file has correct DATABASE_URL
3. Database `rasapp` exists
4. Password in DATABASE_URL is correct

## Next Steps

Once the server is running:
1. ✅ Database connected
2. ✅ Server running on port 3001
3. 🔄 Next: Expose server to internet (see `LOCAL_SETUP.md` for ngrok setup)

