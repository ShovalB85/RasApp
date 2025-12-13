import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get soldier by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const soldier = await prisma.soldier.findUnique({
      where: { id: req.params.id },
      include: {
        assignedItems: true,
        misgeret: true
      }
    });

    if (!soldier) {
      return res.status(404).json({ error: 'Soldier not found' });
    }

    res.json(soldier);
  } catch (error) {
    console.error('Get soldier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign item to soldier
router.post('/:id/assign-item', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, serialNumber, provider, inventoryItemId, taasukaId } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    if (!name || !quantity) {
      return res.status(400).json({ error: 'Name and quantity are required' });
    }

    // Check permissions if item is from taasuka inventory
    // Admins can always assign items, skip check
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin && inventoryItemId && taasukaId) {
      // For non-admins, check if they're rassap assigned to taasuka
      const taasuka = await prisma.taasuka.findUnique({
        where: { id: taasukaId },
        select: { personnelIds: true }
      });

      if (!taasuka) {
        return res.status(404).json({ error: 'Taasuka not found' });
      }

      const isRassap = userRole === 'rassap';
      const isAssignedToTaasuka = taasuka.personnelIds.includes(userId || '');

      if (!(isRassap && isAssignedToTaasuka)) {
        return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can assign items' });
      }
    }

    const assignedItem = await prisma.assignedItem.create({
      data: {
        name,
        quantity,
        serialNumber: serialNumber || null,
        provider: provider || 'Rassapiya',
        inventoryItemId: inventoryItemId || null,
        taasukaId: taasukaId || null,
        soldierId: id
      }
    });

    // If item has serial number and is from inventory, remove the serial number from inventory
    // This is allowed for rassaps as part of the assignment process (not a direct removal)
    if (serialNumber && inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId }
      });

      if (inventoryItem && inventoryItem.hasSerialNumber) {
        const currentSerialNumbers = inventoryItem.serialNumbers || [];
        const updatedSerialNumbers = currentSerialNumbers.filter(sn => sn !== serialNumber);
        
        await prisma.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { serialNumbers: updatedSerialNumbers }
        });
      }
    }

    res.json(assignedItem);
  } catch (error) {
    console.error('Assign item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update assigned item quantity
router.put('/:id/assigned-items/:itemId', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id: soldierId, itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    // Get the assigned item
    const assignedItem = await prisma.assignedItem.findUnique({
      where: { id: itemId },
      include: {
        soldier: true
      }
    });

    if (!assignedItem) {
      return res.status(404).json({ error: 'Assigned item not found' });
    }

    // Check if item belongs to the soldier
    if (assignedItem.soldierId !== soldierId) {
      return res.status(400).json({ error: 'Item does not belong to this soldier' });
    }

    // Check permissions
    if (assignedItem.taasukaId) {
      const taasuka = await prisma.taasuka.findUnique({
        where: { id: assignedItem.taasukaId },
        select: { personnelIds: true }
      });

      if (taasuka) {
        const user = await prisma.soldier.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const isAdmin = user.role === 'admin';
        const isRassap = user.role === 'rassap' || user.role === 'admin';
        const isAssignedToTaasuka = taasuka.personnelIds.includes(userId);

        if (!isAdmin && !(isRassap && isAssignedToTaasuka)) {
          return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can update items' });
        }
      }
    }

    // If quantity is 0, delete the item (same as unassign)
    if (quantity === 0) {
      // Handle returning to inventory if needed
      if (assignedItem.inventoryItemId && assignedItem.taasukaId) {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: assignedItem.inventoryItemId }
        });

        if (inventoryItem) {
          const updateData: any = {};
          
          // If item has a serial number, return it to serialNumbers array
          if (assignedItem.serialNumber && inventoryItem.hasSerialNumber) {
            const currentSerialNumbers = inventoryItem.serialNumbers || [];
            if (!currentSerialNumbers.includes(assignedItem.serialNumber)) {
              updateData.serialNumbers = [...currentSerialNumbers, assignedItem.serialNumber];
            }
          } else {
            // Regular item - DO NOT add quantity back (total stays fixed)
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.inventoryItem.update({
              where: { id: assignedItem.inventoryItemId },
              data: updateData
            });
          }
        }
      }

      await prisma.assignedItem.delete({
        where: { id: itemId }
      });

      return res.json({ message: 'Item removed successfully', deleted: true });
    }

    // Update the quantity
    // For serial number items, quantity is always 1 and cannot be changed
    if (assignedItem.serialNumber && quantity !== 1) {
      return res.status(400).json({ error: 'Serial number items always have quantity of 1' });
    }

    const updatedItem = await prisma.assignedItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        soldier: true
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Update assigned item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove assigned item
router.delete('/:id/assigned-items/:itemId', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id: soldierId, itemId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the assigned item first
    const assignedItem = await prisma.assignedItem.findUnique({
      where: { id: itemId },
      include: {
        soldier: true
      }
    });

    if (!assignedItem) {
      return res.status(404).json({ error: 'Assigned item not found' });
    }

    // Check if item belongs to the soldier
    if (assignedItem.soldierId !== soldierId) {
      return res.status(400).json({ error: 'Item does not belong to this soldier' });
    }

    // If item is from taasuka inventory, check permissions and return to inventory
    if (assignedItem.inventoryItemId && assignedItem.taasukaId) {
      // Check if user is assigned to the taasuka
      const taasuka = await prisma.taasuka.findUnique({
        where: { id: assignedItem.taasukaId },
        select: { personnelIds: true }
      });

      if (!taasuka) {
        return res.status(404).json({ error: 'Taasuka not found' });
      }

      // Check if user is admin or rassap assigned to this taasuka
      const user = await prisma.soldier.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isAdmin = user.role === 'admin';
      const isRassap = user.role === 'rassap' || user.role === 'admin';
      const isAssignedToTaasuka = taasuka.personnelIds.includes(userId);

      if (!isAdmin && !(isRassap && isAssignedToTaasuka)) {
        return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can unassign items' });
      }

      // Get the inventory item and add the quantity/serial number back
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: assignedItem.inventoryItemId }
      });

      if (inventoryItem) {
        const updateData: any = {};
        
        // If item has a serial number, return it to serialNumbers array
        if (assignedItem.serialNumber && inventoryItem.hasSerialNumber) {
          const currentSerialNumbers = inventoryItem.serialNumbers || [];
          // Only add if not already in the array (avoid duplicates)
          if (!currentSerialNumbers.includes(assignedItem.serialNumber)) {
            updateData.serialNumbers = [...currentSerialNumbers, assignedItem.serialNumber];
          }
        } else {
          // Regular item or לל"צ - DO NOT add quantity back
          // Quantity represents total capacity, not available inventory
          // Available is calculated as (total - assigned), not stored
        }
        
        await prisma.inventoryItem.update({
          where: { id: assignedItem.inventoryItemId },
          data: updateData
        });
      }
    } else if (assignedItem.taasukaId) {
      // External item linked to taasuka - still check permissions
      const taasuka = await prisma.taasuka.findUnique({
        where: { id: assignedItem.taasukaId },
        select: { personnelIds: true }
      });

      if (taasuka) {
        const user = await prisma.soldier.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const isAdmin = user.role === 'admin';
        const isRassap = user.role === 'rassap' || user.role === 'admin';
        const isAssignedToTaasuka = taasuka.personnelIds.includes(userId);

        if (!isAdmin && !(isRassap && isAssignedToTaasuka)) {
          return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can unassign items' });
        }
      }
    }

    // Delete the assigned item
    await prisma.assignedItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Remove assigned item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update soldier role
router.put('/:id/role', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'rassap', 'soldier'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    // Get current soldier info
    const currentSoldier = await prisma.soldier.findUnique({
      where: { id },
      select: { role: true }
    });

    if (!currentSoldier) {
      return res.status(404).json({ error: 'Soldier not found' });
    }

    // Update the role
    const soldier = await prisma.soldier.update({
      where: { id },
      data: { role },
      include: {
        misgeret: true,
        assignedItems: true
      }
    });

    // If role changed to admin, add them to all existing taasukot
    if (role === 'admin' && currentSoldier.role !== 'admin') {
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

    // If role changed from admin to something else, remove them from all taasukot
    if (currentSoldier.role === 'admin' && role !== 'admin') {
      const allTaasukot = await prisma.taasuka.findMany({
        select: { id: true, personnelIds: true }
      });

      // Remove from all taasukot
      await Promise.all(
        allTaasukot.map(taasuka => {
          if (taasuka.personnelIds.includes(soldier.id)) {
            return prisma.taasuka.update({
              where: { id: taasuka.id },
              data: {
                personnelIds: taasuka.personnelIds.filter(pid => pid !== soldier.id)
              }
            });
          }
          return Promise.resolve();
        })
      );
    }

    res.json(soldier);
  } catch (error) {
    console.error('Update soldier role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete soldier
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if soldier exists
    const soldier = await prisma.soldier.findUnique({
      where: { id },
      include: {
        assignedItems: true
      }
    });

    if (!soldier) {
      return res.status(404).json({ error: 'Soldier not found' });
    }

    // Check if soldier has assigned items
    if (soldier.assignedItems.length > 0) {
      return res.status(400).json({ error: 'Cannot delete soldier with assigned items. Please unassign all items first.' });
    }

    // Check if soldier is assigned to any taasuka
    const taasukotWithSoldier = await prisma.taasuka.findMany({
      where: {
        personnelIds: {
          has: id
        }
      }
    });

    if (taasukotWithSoldier.length > 0) {
      return res.status(400).json({ error: 'Cannot delete soldier assigned to taasukot. Please remove from all taasukot first.' });
    }

    // Delete the soldier (this will cascade delete assignedItems due to schema)
    await prisma.soldier.delete({
      where: { id }
    });

    res.json({ message: 'Soldier deleted successfully' });
  } catch (error) {
    console.error('Delete soldier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


