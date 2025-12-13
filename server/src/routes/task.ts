import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create task
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      startDate,
      isAllDay,
      isRecurring,
      recurrence,
      assignedToType,
      assignedToIds,
      notifyOnComplete,
      taasukaId
    } = req.body;

    if (!title || !taasukaId) {
      return res.status(400).json({ error: 'Title and taasuka ID are required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        startDate: new Date(startDate),
        isAllDay: isAllDay || false,
        isRecurring: isRecurring || false,
        recurrence: recurrence || null,
        assignedToType,
        assignedToIds: assignedToIds || [],
        notifyOnComplete: notifyOnComplete || 'creator',
        creatorId: req.userId!,
        taasukaId
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }

    const task = await prisma.task.update({
      where: { id },
      data: updates
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


