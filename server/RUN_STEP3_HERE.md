# Step 3: Install & Setup - Run HERE

## Location

Run Step 3 commands **in the `server` folder** - which is where you are right now!

```
C:\Users\Home\Desktop\Projects\RasApp\server  ← Run commands HERE
```

## Commands to Run

Make sure you're in the `server` folder, then run these commands **one at a time**:

### 1. Install Dependencies
```powershell
npm install
```
This installs all required packages. Takes a few minutes.

### 2. Generate Prisma Client
```powershell
npm run db:generate
```
This creates the database client code.

### 3. Create Database Tables
```powershell
npm run db:migrate
```
This creates all tables in your PostgreSQL database.

### 4. Seed Initial Data
```powershell
npm run db:seed
```
This adds the default admin user.

## Verify You're in the Right Place

Before running, check:
```powershell
Get-Location
# Should show: C:\Users\Home\Desktop\Projects\RasApp\server

# Check that package.json exists
Test-Path package.json
# Should show: True
```

## Complete Step 3 Sequence

Run these commands **in order** from the `server` folder:

```powershell
# Step 3.1: Install dependencies
npm install

# Step 3.2: Generate database client
npm run db:generate

# Step 3.3: Create database tables
npm run db:migrate

# Step 3.4: Add initial admin user
npm run db:seed
```

## After Step 3

Once all commands complete successfully:
- ✅ Database tables created
- ✅ Admin user added (Personal ID: 8223283, Password: P)O(I*q1w2e3)
- ✅ Ready to start server

**Next:** Step 4 - Start the server with `npm run dev`

