# Setup Instructions for Multi-User RasApp

## Overview

I've created a complete backend server with PostgreSQL database support. The app can now support multiple users simultaneously with data stored in a cloud-accessible database.

## What's Been Created

### Backend Server (`server/` directory)
- ✅ Express.js API server with TypeScript
- ✅ PostgreSQL database schema with Prisma ORM
- ✅ JWT authentication system
- ✅ REST API endpoints for all operations
- ✅ Role-based access control (admin, rassap, soldier)

### Frontend Updates
- ✅ API service layer (`services/apiService.ts`)
- ✅ Updated database service to support API (with localStorage fallback)
- ✅ Environment configuration support

## Quick Setup

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**
1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE rasapp;
   ```
3. Create `.env` file in `server/`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/rasapp?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   PORT=3001
   CORS_ORIGINS="http://localhost:3000"
   ```

**Option B: Cloud Database (Recommended)**
1. Sign up for a free PostgreSQL service:
   - **Supabase** (recommended): https://supabase.com
   - **Railway**: https://railway.app
   - **Render**: https://render.com
2. Get your connection string and add it to `server/.env`

### 3. Initialize Database

```bash
cd server
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed initial admin user
```

The seed creates:
- Default misgeret: "מטה כללי"
- Admin user:
  - Personal ID: `8223283`
  - Password: `P)O(I*q1w2e3`

### 4. Start Backend Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3001`

### 5. Configure Frontend

Create `.env.local` in the root directory:

```
VITE_API_URL=http://localhost:3001/api
VITE_USE_API=true
```

Or enable API mode manually:
```javascript
localStorage.setItem('rassapp-use-api', 'true');
```

### 6. Start Frontend

```bash
npm run dev
```

## Current Status

The backend is **fully functional** and ready to use. The frontend currently:
- ✅ Can connect to the API
- ✅ Has API service layer ready
- ⚠️ Still uses localStorage by default (for backward compatibility)

## Next Steps for Full Migration

To fully migrate the frontend to use the API:

1. **Update Login Flow** - Use `authApi.login()` instead of local authentication
2. **Update Data Loading** - Already supports API via `getData()` 
3. **Update Individual Operations** - Replace direct state updates with API calls:
   - Creating taasukot → `taasukaApi.create()`
   - Adding inventory → `taasukaApi.addInventory()`
   - Creating tasks → `taskApi.create()`
   - etc.

The API service (`services/apiService.ts`) has all the methods ready to use.

## Testing

1. Start the backend: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Enable API mode in browser console: `localStorage.setItem('rassapp-use-api', 'true')`
4. Refresh and login with:
   - Personal ID: `8223283`
   - Password: `P)O(I*q1w2e3`

## Deployment

See `MIGRATION_GUIDE.md` for deployment instructions to services like Railway, Render, or Heroku.

## API Endpoints

All endpoints are under `/api/`:

- **Auth**: `/api/auth/login`, `/api/auth/set-password`, `/api/auth/change-password`, `/api/auth/me`
- **Misgerets**: `/api/misgerets` (GET, POST), `/api/misgerets/:id/personnel` (POST)
- **Taasukot**: `/api/taasukot` (GET, POST), `/api/taasukot/:id` (GET, PUT, DELETE)
- **Inventory**: `/api/taasukot/:id/inventory` (POST, PUT, DELETE)
- **Soldiers**: `/api/soldiers/:id` (GET), `/api/soldiers/:id/assign-item` (POST)
- **Tasks**: `/api/tasks` (POST, PUT, DELETE)
- **Notifications**: `/api/notifications` (GET), `/api/notifications/:id/read` (PUT)

See `server/README.md` for full API documentation.


