-- AlterTable
ALTER TABLE "AssignedItem" ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "serialNumbers" TEXT[];
