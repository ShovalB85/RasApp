import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all taasukot
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const taasukot = await prisma.taasuka.findMany({
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });
    res.json(taasukot);
  } catch (error) {
    console.error('Get taasukot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single taasuka
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    const taasuka = await prisma.taasuka.findUnique({
      where: { id: req.params.id },
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });

    if (!taasuka) {
      return res.status(404).json({ error: 'Taasuka not found' });
    }

    // Check permissions: only admins or users assigned to taasuka can view it
    const isAdmin = userRole === 'admin';
    const isAssignedToTaasuka = taasuka.personnelIds.includes(userId || '');

    if (!isAdmin && !isAssignedToTaasuka) {
      return res.status(403).json({ error: 'You do not have permission to view this taasuka. Only admins or assigned personnel can access it.' });
    }

    res.json(taasuka);
  } catch (error) {
    console.error('Get taasuka error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create taasuka
router.post('/', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { name, misgeretId } = req.body;

    if (!name || !misgeretId) {
      return res.status(400).json({ error: 'Name and misgeret ID are required' });
    }

    // Get all admins to add them to the new taasuka
    const admins = await prisma.soldier.findMany({
      where: { role: 'admin' },
      select: { id: true }
    });
    const adminIds = admins.map(admin => admin.id);

    const taasuka = await prisma.taasuka.create({
      data: {
        name,
        misgeretId,
        personnelIds: adminIds // Automatically add all admins
      },
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });

    res.json(taasuka);
  } catch (error) {
    console.error('Create taasuka error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update taasuka
router.put('/:id', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, personnelIds, teams } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (personnelIds) updateData.personnelIds = personnelIds;

    const taasuka = await prisma.taasuka.update({
      where: { id },
      data: updateData,
      include: {
        inventory: true,
        tasks: true,
        teams: true,
        misgeret: true
      }
    });

    res.json(taasuka);
  } catch (error) {
    console.error('Update taasuka error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete taasuka
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await prisma.taasuka.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Taasuka deleted successfully' });
  } catch (error) {
    console.error('Delete taasuka error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory operations
router.post('/:id/inventory', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { name, quantity }
    const userId = req.userId;
    const userRole = req.userRole;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // Check permissions: only admins or rassaps assigned to taasuka can add inventory
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      const taasuka = await prisma.taasuka.findUnique({
        where: { id },
        select: { personnelIds: true }
      });

      if (!taasuka) {
        return res.status(404).json({ error: 'Taasuka not found' });
      }

      const isRassap = userRole === 'rassap';
      const isAssignedToTaasuka = taasuka.personnelIds.includes(userId || '');

      if (!(isRassap && isAssignedToTaasuka)) {
        return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can add inventory items' });
      }
    }

    const createdItems = await Promise.all(
      items.map((item: { name: string; quantity: number; hasSerialNumber?: boolean; serialNumbers?: string[] }) =>
        prisma.inventoryItem.create({
          data: {
            name: item.name,
            quantity: item.quantity || 0,
            hasSerialNumber: item.hasSerialNumber || false,
            serialNumbers: item.serialNumbers || [],
            taasukaId: id
          }
        })
      )
    );

    res.json(createdItems);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/inventory/:itemId', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    const { id: taasukaId, itemId } = req.params;
    const { quantity, serialNumbers } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    // Get current item to check if we need to delete it
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check permissions: only admins or rassaps assigned to taasuka can update inventory
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
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
        return res.status(403).json({ error: 'Only rassap assigned to taasuka or admin can update inventory items' });
      }
    }

    // Check if user is rassap (not admin) and trying to decrease quantity
    const isRassap = userRole === 'rassap';
    
    if (isRassap && quantity !== undefined && !currentItem.hasSerialNumber) {
      // For regular items, check if quantity is decreasing
      const currentQuantity = currentItem.quantity || 0;
      if (quantity < currentQuantity) {
        return res.status(403).json({ 
          error: 'רספ"ים יכולים רק להגדיל כמות, לא להקטין. רק מנהלים יכולים להקטין כמות.' 
        });
      }
    }
    
    if (isRassap && serialNumbers !== undefined && currentItem.hasSerialNumber) {
      // For צל"ם items, check if serial numbers are being removed
      const currentSerialNumbers = currentItem.serialNumbers || [];
      if (serialNumbers.length < currentSerialNumbers.length) {
        return res.status(403).json({ 
          error: 'רספ"ים יכולים רק להוסיף מס"דים, לא להסיר. רק מנהלים יכולים להסיר מס"דים.' 
        });
      }
    }

    // Validate quantity is not below assigned for regular items
    if (quantity !== undefined && !currentItem.hasSerialNumber) {
      // Count assigned items for this inventory item
      const assignedItems = await prisma.assignedItem.findMany({
        where: {
          inventoryItemId: itemId,
          serialNumber: null // Only count regular items (not serial-numbered)
        }
      });
      const assignedQuantity = assignedItems.reduce((sum, ai) => sum + ai.quantity, 0);
      
      if (quantity < assignedQuantity) {
        return res.status(400).json({ 
          error: `Cannot set quantity below assigned amount. Minimum: ${assignedQuantity} (${assignedQuantity} items are currently assigned)` 
        });
      }
    }

    const updateData: any = {};
    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }
    if (serialNumbers !== undefined) {
      updateData.serialNumbers = serialNumbers;
    }

    // Check if total becomes 0 (for צל"ם items)
    const finalQuantity = quantity !== undefined ? quantity : currentItem.quantity || 0;
    const finalSerialNumbers = serialNumbers !== undefined ? serialNumbers : (currentItem.serialNumbers || []);
    
    // If item has serial numbers, check if total is 0
    if (currentItem.hasSerialNumber) {
      const totalSNs = finalSerialNumbers.length;
      if (totalSNs === 0 && finalQuantity <= 0) {
        // Delete the item (only admins can delete)
        if (!isAdmin) {
          return res.status(403).json({ 
            error: 'רק מנהלים יכולים למחוק פריטים מהמלאי' 
          });
        }
        await prisma.inventoryItem.delete({
          where: { id: itemId }
        });
        return res.json({ message: 'Item deleted (total = 0)', deleted: true });
      }
    } else {
      // Regular item - delete if quantity is 0 (only admins can delete)
      if (finalQuantity <= 0) {
        if (!isAdmin) {
          return res.status(403).json({ 
            error: 'רק מנהלים יכולים למחוק פריטים מהמלאי' 
          });
        }
        await prisma.inventoryItem.delete({
          where: { id: itemId }
        });
        return res.json({ message: 'Item deleted (quantity = 0)', deleted: true });
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData
    });

    res.json(item);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/inventory/:itemId', authenticate, requireRole('admin', 'rassap'), async (req: AuthRequest, res) => {
  try {
    await prisma.inventoryItem.delete({
      where: { id: req.params.itemId }
    });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


