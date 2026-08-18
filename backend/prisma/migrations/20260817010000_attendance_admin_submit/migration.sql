-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_takenByTeacherId_fkey";

-- AlterTable
ALTER TABLE "AttendanceRecord" ALTER COLUMN "takenByTeacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_takenByTeacherId_fkey" FOREIGN KEY ("takenByTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

