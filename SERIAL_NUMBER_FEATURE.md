# Serial Number (צל"ם) Feature Implementation Guide

This document outlines the implementation of the Serial Number feature for inventory items.

## Database Migration Required

Before using this feature, you **MUST** run a database migration to add the new fields:

```powershell
cd server
npm run db:migrate
```

This will:
- Add `hasSerialNumber` boolean field to `InventoryItem` table
- Add `serialNumber` string field to `AssignedItem` table

## Feature Overview

1. **צל"ם Toggle**: Inventory items can be marked as "צל"ם" (items requiring unique serial numbers)
2. **Serial Number Input**: When assigning צל"ם items, a serial number must be entered
3. **Quantity = 1**: For צל"ם items, quantity is always 1 per assignment
4. **Item Clustering**: Items with serial numbers are grouped/clustered in the inventory display
5. **Serial Number Display**: SNs appear in soldier profiles and טופס 1008 PDF

## Implementation Status

✅ Database schema updated
✅ TypeScript types updated
✅ Backend API routes updated
⏳ Frontend UI updates (in progress)
⏳ Inventory clustering (in progress)
⏳ PDF serial number display (in progress)

## Next Steps

1. Run database migration: `cd server && npm run db:migrate`
2. Update frontend modals to support צל"ם toggle
3. Update assignment flow to handle serial numbers
4. Implement inventory clustering for items with SNs
5. Update PDF generation to display serial numbers

