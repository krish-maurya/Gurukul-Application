-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "avatar" TEXT,
    "staffId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "staffId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "rollNumber" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT,
    "medicalNotes" TEXT,
    "previousSchool" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "amountDue" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "maxPeriodsPerDay" INTEGER NOT NULL DEFAULT 4,
    "maxPeriodsPerWeek" INTEGER NOT NULL DEFAULT 24,
    "maxProxiesPerDay" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LECTURE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyPeriods" INTEGER NOT NULL DEFAULT 3,
    "requiresLab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSubject" (
    "staffId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffSubject_pkey" PRIMARY KEY ("staffId","subjectId")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherLeave" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxyAssignment" (
    "id" TEXT NOT NULL,
    "timetableSlotId" TEXT NOT NULL,
    "absentTeacherId" TEXT NOT NULL,
    "proxyTeacherId" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "selectedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProxyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherWorkload" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "lectureCount" INTEGER NOT NULL DEFAULT 0,
    "proxyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomReservation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timetableSlotId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulingConstraint" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableConflict" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedFix" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "affectedSlots" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'Admission Form',
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rawText" TEXT,
    "extractedFields" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "date" TEXT NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 1,
    "takenByTeacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEntry" (
    "id" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rollNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_staffId_key" ON "Invitation"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAccount_studentId_key" ON "FeeAccount"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_receiptNo_key" ON "FeePayment"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNumber_key" ON "Room"("roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "TimetableSlot_day_period_teacherId_idx" ON "TimetableSlot"("day", "period", "teacherId");

-- CreateIndex
CREATE INDEX "TimetableSlot_day_period_roomId_idx" ON "TimetableSlot"("day", "period", "roomId");

-- CreateIndex
CREATE INDEX "TeacherLeave_date_status_idx" ON "TeacherLeave"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherLeave_teacherId_date_key" ON "TeacherLeave"("teacherId", "date");

-- CreateIndex
CREATE INDEX "ProxyAssignment_date_proxyTeacherId_idx" ON "ProxyAssignment"("date", "proxyTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ProxyAssignment_timetableSlotId_date_key" ON "ProxyAssignment"("timetableSlotId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherWorkload_teacherId_date_key" ON "TeacherWorkload"("teacherId", "date");

-- CreateIndex
CREATE INDEX "RoomReservation_date_day_period_roomId_idx" ON "RoomReservation"("date", "day", "period", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingConstraint_key_key" ON "SchedulingConstraint"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAccount" ADD CONSTRAINT "FeeAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "FeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherLeave" ADD CONSTRAINT "TeacherLeave_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyAssignment" ADD CONSTRAINT "ProxyAssignment_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyAssignment" ADD CONSTRAINT "ProxyAssignment_proxyTeacherId_fkey" FOREIGN KEY ("proxyTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherWorkload" ADD CONSTRAINT "TeacherWorkload_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomReservation" ADD CONSTRAINT "RoomReservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_takenByTeacherId_fkey" FOREIGN KEY ("takenByTeacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

