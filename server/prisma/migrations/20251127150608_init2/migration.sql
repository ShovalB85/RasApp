-- AlterTable
ALTER TABLE "AssignedItem" ADD COLUMN     "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "hasSerialNumber" BOOLEAN NOT NULL DEFAULT false;
