# RasApp Backend Server

Backend API server for the RasApp military logistics management system.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: A strong random string for JWT token signing
   - `PORT`: Server port (default: 3001)
   - `CORS_ORIGINS`: Comma-separated list of allowed origins

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

4. **Start the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE rasapp;
   ```
3. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/rasapp?schema=public"
   ```

### Option 2: Cloud Database (Recommended for production)

Use a cloud PostgreSQL service like:
- **Supabase** (free tier available): https://supabase.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **AWS RDS**: https://aws.amazon.com/rds
- **Google Cloud SQL**: https://cloud.google.com/sql

Get the connection string from your provider and set it in `.env`.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with personal ID and password
- `POST /api/auth/set-password` - Set password for first-time users
- `POST /api/auth/change-password` - Change password (requires auth)
- `GET /api/auth/me` - Get current user info (requires auth)

### Misgerets
- `GET /api/misgerets` - Get all misgerets
- `POST /api/misgerets` - Create misgeret (admin only)
- `POST /api/misgerets/:id/personnel` - Add personnel (admin/rassap only)

### Taasukot
- `GET /api/taasukot` - Get all taasukot
- `GET /api/taasukot/:id` - Get single taasuka
- `POST /api/taasukot` - Create taasuka
- `PUT /api/taasukot/:id` - Update taasuka
- `DELETE /api/taasukot/:id` - Delete taasuka (admin only)
- `POST /api/taasukot/:id/inventory` - Add inventory items
- `PUT /api/taasukot/:id/inventory/:itemId` - Update inventory item
- `DELETE /api/taasukot/:id/inventory/:itemId` - Delete inventory item

### Soldiers
- `GET /api/soldiers/:id` - Get soldier details
- `POST /api/soldiers/:id/assign-item` - Assign item to soldier
- `DELETE /api/soldiers/:id/assigned-items/:itemId` - Remove assigned item

### Tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (admin/rassap only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Development

- Use `npm run db:studio` to open Prisma Studio for database management
- The server runs on port 3001 by default
- CORS is configured to allow requests from `http://localhost:3000` by default


