# Migration Guide: Local Storage to API

This guide explains how to migrate from local storage to the API-based backend.

## Quick Start

1. **Set up the backend server:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

2. **Set up the frontend:**
   ```bash
   # In the root directory
   npm install
   # Add VITE_API_URL to .env.local (optional, defaults to http://localhost:3001/api)
   npm run dev
   ```

3. **Initialize the database:**
   The first admin user needs to be created. You can either:
   - Use Prisma Studio: `cd server && npm run db:studio`
   - Or create a seed script (see below)

## Database Seeding

Create `server/prisma/seed.ts` to initialize with default data:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default misgeret
  const misgeret = await prisma.misgeret.create({
    data: {
      name: 'מטה כללי',
      personnel: {
        create: {
          name: 'שובל ברמלי',
          personalId: '8223283',
          passwordHash: await bcrypt.hash('P)O(I*q1w2e3', 10),
          role: 'admin',
        },
      },
    },
  });

  console.log('Seeded:', misgeret);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `server/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

## Environment Variables

### Backend (.env in server/)
```
DATABASE_URL="postgresql://user:password@localhost:5432/rasapp"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
CORS_ORIGINS="http://localhost:3000"
```

### Frontend (.env.local in root/)
```
VITE_API_URL=http://localhost:3001/api
```

## Deployment

### Backend Deployment Options

1. **Railway** (Recommended for beginners):
   - Connect your GitHub repo
   - Add PostgreSQL database
   - Set environment variables
   - Deploy

2. **Render**:
   - Create a new Web Service
   - Connect your repo
   - Add PostgreSQL database
   - Set build command: `cd server && npm install && npm run build`
   - Set start command: `cd server && npm start`

3. **Heroku**:
   - Create app and add PostgreSQL addon
   - Set buildpacks for Node.js
   - Deploy

### Frontend Deployment

Deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

Make sure to set `VITE_API_URL` to your backend URL.

## Key Changes

- Data is now stored in PostgreSQL instead of localStorage
- Authentication uses JWT tokens
- All operations are API calls
- Multiple users can access the system simultaneously
- Data is synchronized across all clients


