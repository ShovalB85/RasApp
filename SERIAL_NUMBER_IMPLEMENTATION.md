# Serial Number (צל"ם) Feature - Implementation Status

## ✅ Completed

1. **Database Schema**: Updated `InventoryItem` and `AssignedItem` models to support serial numbers
2. **TypeScript Types**: Updated `InventoryItem` and `AssignedItem` interfaces
3. **Backend API**: Updated routes to handle `hasSerialNumber` and `serialNumber` fields
4. **Add Item Modal**: Added צל"ם toggle checkbox
5. **Assign Item Modal**: Shows serial number input field when item is צל"ם
6. **Assignment Logic**: Updated to handle serial numbers in both API and local storage modes
7. **PDF Generation**: Serial numbers now display in טופס 1008 under מס"ד column

## ⚠️ CRITICAL: Run Database Migration First!

**Before using this feature, you MUST run the database migration:**

```powershell
cd server
npm run db:migrate
```

This will add:
- `hasSerialNumber` field to `InventoryItem` table
- `serialNumber` field to `AssignedItem` table

## 📋 Still TODO (Future Enhancements)

1. **Inventory Clustering**: Group items with serial numbers and show expandable list of SNs and assignments
   - Items with same name but different SNs should be clustered
   - Click to expand and see all SNs and who they're assigned to
   
2. **Soldier Profile**: Display serial numbers for assigned items (currently shows items, but SN display can be enhanced)

3. **Bulk Assignment**: Update bulk assign modal to handle צל"ם items

4. **Update Item Modal**: Allow toggling צל"ם on/off for existing items

## 🚀 How to Use

1. **Create צל"ם Item**:
   - Click "הוסף פריט" in inventory
   - Enter item name
   - Check "צל"ם (פריט עם מספר סידורי)"
   - Quantity field will be hidden (always 1 per assignment)

2. **Assign צל"ם Item**:
   - Select the צל"ם item from dropdown
   - Enter the serial number in the מס"ד field
   - Quantity is automatically set to 1

3. **View in PDF**:
   - Generate טופס 1008 for a soldier
   - Serial numbers appear in the מס"ד column

## 🔧 Technical Details

- **Quantity**: For צל"ם items, quantity is always 1 per assignment
- **Serial Number**: Required when assigning צל"ם items, optional for regular items
- **Storage**: Serial numbers are stored in the `AssignedItem` record
- **Display**: Serial numbers appear in soldier profiles and PDF forms

