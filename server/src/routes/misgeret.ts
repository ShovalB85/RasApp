import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all misgerets
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get all admins to add them to all misgerets
    const allAdmins = await prisma.soldier.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        personalId: true,
        role: true,
        assignedItems: true
      }
    });

    const misgerets = await prisma.misgeret.findMany({
      include: {
        personnel: {
          select: {
            id: true,
            name: true,
            personalId: true,
            role: true,
            assignedItems: true
          }
        }
      }
    });

    // Add all admins to each misgeret's personnel list (if not already present)
    const misgeretsWithAdmins = misgerets.map(misgeret => {
      const existingPersonnelIds = new Set(misgeret.personnel.map(p => p.id));
      const adminsToAdd = allAdmins.filter(admin => !existingPersonnelIds.has(admin.id));
      
      return {
        ...misgeret,
        personnel: [...misgeret.personnel, ...adminsToAdd]
      };
    });

    res.json(misgeretsWithAdmins);
  } catch (error) {
    console.error('Get misgerets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create misgeret (admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const misgeret = await prisma.misgeret.create({
      data: { name },
      include: { personnel: true }
    });

    res.json(misgeret);
  } catch (error) {
    console.error('Create misgeret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add personnel to misgeret (admin/rassap only)
router.post('/:misgeretId/personnel', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { misgeretId } = req.params;
    const { name, personalId, role } = req.body;

    if (!name || !personalId) {
      return res.status(400).json({ error: 'Name and personal ID are required' });
    }

    // Check if a soldier with this personalId already exists
    const existingSoldier = await prisma.soldier.findUnique({
      where: { personalId }
    });

    let soldier;
    if (existingSoldier) {
      // If soldier exists, update it instead of creating new
      // This allows re-adding a soldier that was previously deleted or exists in another misgeret
      soldier = await prisma.soldier.update({
        where: { personalId },
        data: {
          name,
          role: role || existingSoldier.role, // Keep existing role if not specified
          misgeretId,
          // Don't reset password - let them keep it if they have one
          // passwordHash: null 
        },
        include: {
          misgeret: true,
          assignedItems: true
        }
      });
    } else {
      // Create new soldier
      soldier = await prisma.soldier.create({
        data: {
          name,
          personalId,
          role: role || 'soldier',
          misgeretId
        },
        include: {
          misgeret: true,
          assignedItems: true
        }
      });
    }

    // If the new soldier is an admin, add them to all existing taasukot
    if (role === 'admin') {
      const allTaasukot = await prisma.taasuka.findMany({
        select: { id: true, personnelIds: true }
      });

      // Update each taasuka to include the new admin
      await Promise.all(
        allTaasukot.map(taasuka => {
          if (!taasuka.personnelIds.includes(soldier.id)) {
            return prisma.taasuka.update({
              where: { id: taasuka.id },
              data: {
                personnelIds: [...taasuka.personnelIds, soldier.id]
              }
            });
          }
          return Promise.resolve();
        })
      );
    }

    // Ensure CORS headers are set in success response
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json(soldier);
  } catch (error: any) {
    // Ensure CORS headers are set in error responses
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Personal ID already exists' });
    }
    console.error('Add personnel error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;


