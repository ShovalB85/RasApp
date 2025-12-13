import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to set CORS headers
const setCORSHeaders = (req: express.Request, res: express.Response) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
};

// Login
router.post('/login', async (req, res) => {
  // Set CORS headers explicitly
  setCORSHeaders(req, res);
  
  try {
    console.log('Login request body:', JSON.stringify({ personalId: req.body.personalId, hasPassword: !!req.body.password }));
    const { personalId, password } = req.body;

    if (!personalId) {
      console.log('Login error: Personal ID is required');
      return res.status(400).json({ error: 'Personal ID is required' });
    }

    const soldier = await prisma.soldier.findUnique({
      where: { personalId },
      include: { 
        misgeret: true,
        assignedItems: true
      }
    });

    if (!soldier) {
      return res.status(401).json({ error: 'מספר אישי לא נמצא' });
    }

    // IMPORTANT: Check if user has no password FIRST, before checking password
    // This handles the case where a new user tries to login with any password
    if (!soldier.passwordHash) {
      // User has no password - always return needsPassword: true
      // regardless of whether password was provided or not
      return res.status(200).json({
        needsPassword: true,
        personalId: soldier.personalId,
        userId: soldier.id,
        user: {
          id: soldier.id,
          name: soldier.name,
          personalId: soldier.personalId,
          role: soldier.role,
          misgeretId: soldier.misgeretId,
          assignedItems: soldier.assignedItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            provider: item.provider,
            inventoryItemId: item.inventoryItemId,
            taasukaId: item.taasukaId
          }))
        }
      });
    }

    // If password is not provided, return info that password is needed
    // This allows frontend to show password entry screen
    if (!password || password === '') {
      // Return user info so frontend can show password screen
      return res.status(200).json({
        needsPasswordEntry: true,
        personalId: soldier.personalId,
        userId: soldier.id,
        user: {
          id: soldier.id,
          name: soldier.name,
          personalId: soldier.personalId,
          role: soldier.role,
          misgeretId: soldier.misgeretId,
          assignedItems: soldier.assignedItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            provider: item.provider,
            inventoryItemId: item.inventoryItemId,
            taasukaId: item.taasukaId
          }))
        }
      });
    }

    // User has password - verify it
    const isValid = await bcrypt.compare(password, soldier.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'מספר אישי או סיסמה שגויים' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: soldier.id, role: soldier.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: soldier.id,
        name: soldier.name,
        personalId: soldier.personalId,
        role: soldier.role,
        misgeretId: soldier.misgeretId,
        assignedItems: soldier.assignedItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          provider: item.provider,
          inventoryItemId: item.inventoryItemId,
          taasukaId: item.taasukaId
        }))
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set password (for first-time users)
router.post('/set-password', async (req, res) => {
  // Set CORS headers explicitly
  setCORSHeaders(req, res);
  
  try {
    const { personalId, password } = req.body;

    if (!personalId || !password) {
      return res.status(400).json({ error: 'Personal ID and password are required' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const soldier = await prisma.soldier.findUnique({
      where: { personalId }
    });

    if (!soldier) {
      return res.status(404).json({ error: 'Soldier not found' });
    }

    if (soldier.passwordHash) {
      return res.status(400).json({ error: 'Password already set' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.soldier.update({
      where: { id: soldier.id },
      data: { passwordHash }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: soldier.id, role: soldier.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const updatedSoldier = await prisma.soldier.findUnique({
      where: { id: soldier.id },
      include: { assignedItems: true }
    });

    res.json({
      token,
      user: {
        id: updatedSoldier!.id,
        name: updatedSoldier!.name,
        personalId: updatedSoldier!.personalId,
        role: updatedSoldier!.role,
        misgeretId: updatedSoldier!.misgeretId,
        assignedItems: updatedSoldier!.assignedItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          provider: item.provider,
          inventoryItemId: item.inventoryItemId,
          taasukaId: item.taasukaId
        }))
      }
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const soldier = await prisma.soldier.findUnique({
      where: { id: userId! }
    });

    if (!soldier || !soldier.passwordHash) {
      return res.status(404).json({ error: 'Soldier not found or password not set' });
    }

    const isValid = await bcrypt.compare(currentPassword, soldier.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.soldier.update({
      where: { id: userId! },
      data: { passwordHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const soldier = await prisma.soldier.findUnique({
      where: { id: req.userId! },
      include: { misgeret: true }
    });

    if (!soldier) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: soldier.id,
      name: soldier.name,
      personalId: soldier.personalId,
      role: soldier.role,
      misgeretId: soldier.misgeretId
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


