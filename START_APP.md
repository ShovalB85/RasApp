# How to Use the App

## You Have Two Parts:

### 1. Backend API Server (Port 3001) ✅
- **Status:** Running and healthy!
- **URL:** http://localhost:3001
- **Purpose:** Provides API endpoints for data
- **Keep this running** in one terminal

### 2. Frontend App (Port 3000) ⏳
- **Status:** Needs to be started
- **URL:** http://localhost:3000
- **Purpose:** The web interface you'll actually use

## How to Start the Frontend

### Step 1: Open a NEW Terminal Window

Keep the backend server running in the current terminal, and open a **new terminal window**.

### Step 2: Navigate to Project Root

In the new terminal:
```powershell
cd C:\Users\Home\Desktop\Projects\RasApp
```

### Step 3: Start Frontend

```powershell
npm run dev
```

### Step 4: Open in Browser

Visit: **http://localhost:3000**

This is where you'll see the actual RasApp interface!

## Summary

- **Backend (Terminal 1):** `cd server` → `npm run dev` → Port 3001 ✅
- **Frontend (Terminal 2):** `cd RasApp` → `npm run dev` → Port 3000 ⏳

The frontend will automatically connect to the backend API on port 3001.

## Configure Frontend to Use Backend

Make sure your `.env.local` file in the root directory has:
```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_API=true
```

Or the frontend will use localStorage (local-only mode).

## After Starting Frontend

1. Visit http://localhost:3000
2. Login with:
   - Personal ID: `8223283`
   - Password: `P)O(I*q1w2e3`

You're all set! 🎉

