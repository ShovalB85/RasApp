# PostgreSQL Database Setup Guide

## Step 1: Create the Database

### Using Command Line (psql)

**Windows:**
1. Open Command Prompt or PowerShell
2. Navigate to PostgreSQL bin directory (usually `C:\Program Files\PostgreSQL\15\bin`)
3. Or add PostgreSQL to your PATH
4. Run:
   ```bash
   psql -U postgres
   ```

**macOS/Linux:**
```bash
psql -U postgres
```

Then in the psql prompt:
```sql
CREATE DATABASE rasapp;
\q
```

### Using pgAdmin (GUI Tool)

1. Open pgAdmin (usually installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `rasapp`
5. Click "Save"

### Quick Command (Alternative)

**Windows (PowerShell):**
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE rasapp;"
```

**macOS/Linux:**
```bash
createdb -U postgres rasapp
```

## Step 2: Get Your PostgreSQL Connection Details

You'll need:
- **Username:** Usually `postgres` (default)
- **Password:** The password you set during PostgreSQL installation
- **Port:** Usually `5432` (default)
- **Host:** `localhost`

## Step 3: Test Connection

Test that you can connect:
```bash
psql -U postgres -d rasapp
```

If successful, you'll see:
```
rasapp=#
```

Type `\q` to quit.

## Step 4: Create .env File

Navigate to the `server` directory and create a `.env` file:

**Windows (PowerShell):**
```powershell
cd server
@"
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
"@ | Out-File -FilePath .env -Encoding utf8
```

**macOS/Linux:**
```bash
cd server
cat > .env << EOF
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rasapp?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
EOF
```

**Important:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

## Step 5: Verify .env File

Check that the file was created correctly:
```bash
cat .env  # macOS/Linux
Get-Content .env  # Windows PowerShell
```

## Troubleshooting

### Can't find psql command
- Add PostgreSQL to your PATH, or
- Use full path: `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- Or use pgAdmin GUI tool

### Connection refused
- Make sure PostgreSQL service is running:
  - **Windows:** Services → PostgreSQL
  - **macOS:** `brew services list`
  - **Linux:** `sudo systemctl status postgresql`

### Authentication failed
- Check your password is correct
- Try resetting PostgreSQL password if needed

### Database already exists
That's fine! The migration will use the existing database.

## Next Steps

Once the database is created and `.env` is configured:

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

