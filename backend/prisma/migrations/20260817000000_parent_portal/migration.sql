-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "portalToken" TEXT;

-- CreateTable
CREATE TABLE "ParentMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentByName" TEXT,
    "sentAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParentMessage_studentId_status_idx" ON "ParentMessage"("studentId", "status");

-- CreateIndex
CREATE INDEX "ParentMessage_status_createdAt_idx" ON "ParentMessage"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_portalToken_key" ON "Student"("portalToken");

-- AddForeignKey
ALTER TABLE "ParentMessage" ADD CONSTRAINT "ParentMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

