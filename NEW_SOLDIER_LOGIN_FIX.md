# Fix: New Soldier Cannot Log In

## The Problem

When you add a new soldier (חייל), they are created without a password. The login system is designed to handle this, but the frontend needs to be updated to use the API properly.

## Solution

The new soldier needs to **set a password** the first time they log in. Here's how it should work:

### Current Behavior

1. New soldier logs in with their **מספר אישי** (Personal ID)
2. System detects they have no password
3. Shows password setup screen
4. Soldier sets their password
5. They are logged in

### How to Fix Login for New Soldier

The frontend login flow needs to use the API instead of checking local data. Currently it's checking `user.password` from local state, but with the API it needs to:

1. Call `/api/auth/login` with just the personalId
2. If response has `needsPassword: true`, show password setup
3. Call `/api/auth/set-password` to set the password

## Quick Fix Options

### Option 1: Set Password via API (Recommended)

Have the new soldier log in and set their password through the web interface:
1. Soldier enters their **מספר אישי** (Personal ID)
2. System will detect no password and show password setup screen
3. Soldier creates their password
4. They can now log in

### Option 2: Set Password Directly in Database

You can manually set a password for the soldier using Prisma Studio:

```powershell
cd server
npm run db:studio
```

Then:
1. Open the `Soldier` table
2. Find the soldier by their personalId
3. Generate a password hash and update `passwordHash` field

### Option 3: Test the API Directly

Test if the login API works for the new soldier:

```powershell
# Test login (should return needsPassword: true)
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"personalId\":\"SOLDIER_PERSONAL_ID\"}'

# Then set password
curl -X POST http://localhost:3001/api/auth/set-password `
  -H "Content-Type: application/json" `
  -d '{\"personalId\":\"SOLDIER_PERSONAL_ID\",\"password\":\"NewPassword123!\"}'
```

## Frontend Update Needed

The login flow in `App.tsx` needs to be updated to use the API when `USE_API` is true. Currently it only works with localStorage mode.

Would you like me to update the login flow to properly support API mode?

