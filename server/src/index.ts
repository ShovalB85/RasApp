import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import misgeretRoutes from './routes/misgeret.js';
import taasukaRoutes from './routes/taasuka.js';
import soldierRoutes from './routes/soldier.js';
import taskRoutes from './routes/task.js';
import notificationRoutes from './routes/notification.js';
import teamRoutes from './routes/team.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT ?? 3001);
if (Number.isNaN(PORT)) throw new Error(`Invalid PORT: ${process.env.PORT}`);

// Middleware - CORS must be before all routes
const corsOrigins = process.env.CORS_ORIGINS;
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow all origins for development
    if (!corsOrigins || corsOrigins === '*') {
      callback(null, true);
      return;
    }
    const allowedOrigins = corsOrigins.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes - ensure origin header is set
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RasApp API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      misgerets: '/api/misgerets',
      taasukot: '/api/taasukot',
      soldiers: '/api/soldiers',
      tasks: '/api/tasks',
      notifications: '/api/notifications'
    },
    docs: 'See server/README.md for API documentation'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'RasApp API',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/misgerets', misgeretRoutes);
app.use('/api/taasukot', taasukaRoutes);
app.use('/api/soldiers', soldierRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/taasukot', teamRoutes);

// Error handling middleware - must include CORS headers
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Ensure CORS headers are always included in error responses
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Get local IP address for network access
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start server - listen on all interfaces (0.0.0.0) to accept external connections
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log(`🚀 Server running:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log(`   External: Configure port forwarding or use ngrok (see LOCAL_SETUP.md)`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

