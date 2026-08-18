-- AlterTable
ALTER TABLE "ParentMessage" ADD COLUMN     "sentByStaffId" TEXT;

-- CreateIndex
CREATE INDEX "ParentMessage_type_sentByStaffId_idx" ON "ParentMessage"("type", "sentByStaffId");
