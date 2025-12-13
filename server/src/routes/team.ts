import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create or update team
router.post('/:taasukaId/teams', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { taasukaId } = req.params;
    const { id, name, memberIds, leaderId } = req.body;

    if (!name || !taasukaId) {
      return res.status(400).json({ error: 'Name and taasuka ID are required' });
    }

    let team;
    if (id) {
      // Update existing team
      team = await prisma.team.update({
        where: { id },
        data: {
          name,
          memberIds: memberIds || [],
          leaderId: leaderId || memberIds?.[0] || ''
        }
      });
    } else {
      // Create new team
      team = await prisma.team.create({
        data: {
          name,
          taasukaId,
          memberIds: memberIds || [],
          leaderId: leaderId || memberIds?.[0] || ''
        }
      });
    }

    // Get updated taasuka with teams
    const taasuka = await prisma.taasuka.findUnique({
      where: { id: taasukaId },
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });

    res.json(taasuka);
  } catch (error) {
    console.error('Create/update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete team
router.delete('/:taasukaId/teams/:teamId', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { teamId, taasukaId } = req.params;

    await prisma.team.delete({
      where: { id: teamId }
    });

    // Get updated taasuka with teams
    const taasuka = await prisma.taasuka.findUnique({
      where: { id: taasukaId },
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });

    res.json(taasuka);
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

