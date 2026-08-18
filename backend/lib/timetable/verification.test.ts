import { prisma } from "../prisma";
import { proxyService } from "./proxy-service";
import { conflictService } from "./conflict-service";

async function runVerification() {
  console.log("==========================================");
  console.log("🚀 STARTING TIMETABLE VERIFICATION SUITE");
  console.log("==========================================");

  // ----------------------------------------------------
  // TEST 1: TEACHER ABSENCE & PROXY RECOMMENDATIONS
  // ----------------------------------------------------
  console.log("\n[TEST 1] Testing Teacher Absence & Proxy Recommendations...");

  const turing = await prisma.staff.findUnique({
    where: { email: "turing@gurukul.edu" },
  });
  if (!turing) throw new Error("Turing not found");

  const affectedLectures = await proxyService.getAffectedLectures(
    turing.id,
    "2026-08-17",
    true,
  );
  console.log(
    `Found ${affectedLectures.length} affected lecture(s) for Turing on 2026-08-17`,
  );
  if (affectedLectures.length === 0)
    throw new Error("Expected affected lectures for Turing");

  const p1Lecture = affectedLectures.find(
    (l) => l.day === "Mon" && l.period === 1,
  );
  if (!p1Lecture)
    throw new Error("Expected Mon Period 1 lecture to be affected");

  console.log(
    `Lecture: ${p1Lecture.grade} ${p1Lecture.subject.name}, Room: ${p1Lecture.room.roomNumber}`,
  );
  console.log(`Top Recommendations (${p1Lecture.recommendations.length}):`);
  p1Lecture.recommendations.forEach((r, idx) => {
    console.log(
      `  ${idx + 1}. ${r.teacherName} - Score: ${r.score} (Reasons: ${r.reasons.join(", ")})`,
    );
  });

  const adaCandidate = p1Lecture.recommendations.find((r) =>
    r.teacherName.includes("Ada"),
  );
  const graceCandidate = p1Lecture.recommendations.find((r) =>
    r.teacherName.includes("Grace"),
  );
  if (!adaCandidate || !graceCandidate)
    throw new Error("Expected Ada and Grace in proxy recommendations");

  // ----------------------------------------------------
  // TEST 2: PROXY ASSIGNMENT, REASSIGNMENT & DATE ISOLATION
  // ----------------------------------------------------
  console.log(
    "\n[TEST 2] Testing Proxy Assignment, Reassignment & Date Isolation...",
  );

  // Step 2a: Assign Ada
  const assignedAda = await proxyService.selectProxy(
    p1Lecture.proxyAssignmentId,
    adaCandidate.teacherId,
    "user-admin",
  );
  console.log(
    `Assigned proxy to Ada: ${assignedAda.status}, Proxy Teacher: ${assignedAda.proxyTeacherId}`,
  );
  if (
    assignedAda.status !== "ASSIGNED" ||
    assignedAda.proxyTeacherId !== adaCandidate.teacherId
  ) {
    throw new Error("Initial proxy assignment to Ada failed");
  }

  // Step 2b: Reassign to Grace Hopper ("Change Teacher" flow)
  console.log(
    "Testing Reassignment: Changing proxy teacher from Ada to Grace...",
  );
  const reassignedGrace = await proxyService.selectProxy(
    p1Lecture.proxyAssignmentId,
    graceCandidate.teacherId,
    "user-admin",
  );
  console.log(
    `✓ Reassigned proxy to Grace: ${reassignedGrace.status}, Proxy Teacher: ${reassignedGrace.proxyTeacherId}`,
  );
  if (
    reassignedGrace.status !== "ASSIGNED" ||
    reassignedGrace.proxyTeacherId !== graceCandidate.teacherId
  ) {
    throw new Error("Reassigning proxy to Grace Hopper failed");
  }

  // Verify TimetableSlot.teacherId is NOT permanently destroyed in DB
  const dbSlot = await prisma.timetableSlot.findUnique({
    where: { id: p1Lecture.timetableSlotId },
    include: {
      teacher: true,
      proxyAssignments: { include: { proxyTeacher: true } },
    },
  });
  if (!dbSlot) throw new Error("DB slot not found");
  if (dbSlot.teacherId !== turing.id) {
    throw new Error(
      "CRITICAL: TimetableSlot.teacherId was permanently modified!",
    );
  }
  console.log(
    `✓ Original slot.teacherId remains: ${dbSlot.teacher.name} (${dbSlot.teacherId})`,
  );

  // Step 2c: Test Date Isolation (Today vs Tomorrow)
  const mondayProxy = dbSlot.proxyAssignments.find(
    (p) => p.date === "2026-08-17" && p.status === "ASSIGNED",
  );
  const tuesdayProxy = dbSlot.proxyAssignments.find(
    (p) => p.date === "2026-08-18" && p.status === "ASSIGNED",
  );

  console.log(
    `✓ Monday (2026-08-17) Proxy: ${mondayProxy?.proxyTeacher?.name || "None"}`,
  );
  console.log(
    `✓ Tuesday (2026-08-18) Proxy: ${tuesdayProxy?.proxyTeacher?.name || "None (Standard Teacher Active)"}`,
  );

  if (mondayProxy?.proxyTeacher?.name !== "Dr. Grace Hopper") {
    throw new Error("Expected Monday proxy to be Dr. Grace Hopper");
  }
  if (tuesdayProxy !== undefined) {
    throw new Error("Tuesday must NOT inherit Monday's absence or proxy!");
  }

  // ----------------------------------------------------
  // TEST 3: ROOM CLASH CONFLICT & RESOLUTION (MONDAY P2)
  // ----------------------------------------------------
  console.log("\n[TEST 3] Testing Room Clash Detection & Resolution...");

  const monConflictsBefore = await conflictService.detect("2026-08-17");
  console.log(
    `Monday conflicts detected before fix: ${monConflictsBefore.length}`,
  );
  const roomClash = monConflictsBefore.find(
    (c) => c.type === "ROOM_CLASH" || c.type === "ROOM_DOUBLE_BOOKED",
  );
  if (!roomClash) throw new Error("Expected Room Clash on Monday Period 2");
  console.log(`Found clash: ${roomClash.description}`);

  const room102 = roomClash.alternativeRooms.find(
    (r) => r.roomNumber === "Room 102",
  );
  if (!room102)
    throw new Error("Expected Room 102 as alternative room candidate");

  // Reassign slot to Room 102
  console.log(
    `Reassigning slot ${roomClash.timetableSlotId} to Room 102 (${room102.roomId})...`,
  );
  const updatedSlot = await conflictService.reassignRoom(
    roomClash.timetableSlotId,
    room102.roomId,
    "2026-08-17",
  );
  console.log(`✓ Slot updated to room: ${updatedSlot.room.roomNumber}`);
  if (updatedSlot.roomId !== room102.roomId)
    throw new Error("Room reassignment failed in DB");

  const monConflictsAfter = await conflictService.detect("2026-08-17");
  console.log(
    `Monday conflicts detected after fix: ${monConflictsAfter.length}`,
  );
  const roomClashAfter = monConflictsAfter.find(
    (c) => c.type === "ROOM_CLASH" || c.type === "ROOM_DOUBLE_BOOKED",
  );
  if (roomClashAfter)
    throw new Error("Room Clash should be resolved and no longer present");
  console.log("✓ Room Clash successfully resolved!");

  // ----------------------------------------------------
  // TEST 4: LAB CLASH CONFLICT & RESOLUTION (WEDNESDAY P2)
  // ----------------------------------------------------
  console.log("\n[TEST 4] Testing Lab Clash Detection & Resolution...");

  const wedConflictsBefore = await conflictService.detect("2026-08-19");
  console.log(
    `Wednesday conflicts detected before fix: ${wedConflictsBefore.length}`,
  );
  const labClash = wedConflictsBefore.find(
    (c) => c.type === "LAB_CLASH" || c.type === "LAB_DOUBLE_BOOKED",
  );
  if (!labClash) throw new Error("Expected Lab Clash on Wednesday Period 2");
  console.log(`Found clash: ${labClash.description}`);

  const labB = labClash.alternativeRooms.find(
    (r) => r.roomNumber === "Science Lab B",
  );
  if (!labB)
    throw new Error("Expected Science Lab B as alternative lab candidate");

  // Reassign slot to Science Lab B
  console.log(
    `Reassigning slot ${labClash.timetableSlotId} to Science Lab B (${labB.roomId})...`,
  );
  const updatedLabSlot = await conflictService.reassignRoom(
    labClash.timetableSlotId,
    labB.roomId,
    "2026-08-19",
  );
  console.log(`✓ Slot updated to lab: ${updatedLabSlot.room.roomNumber}`);
  if (updatedLabSlot.roomId !== labB.roomId)
    throw new Error("Lab reassignment failed in DB");

  const wedConflictsAfter = await conflictService.detect("2026-08-19");
  console.log(
    `Wednesday conflicts detected after fix: ${wedConflictsAfter.length}`,
  );
  const labClashAfter = wedConflictsAfter.find(
    (c) => c.type === "LAB_CLASH" || c.type === "LAB_DOUBLE_BOOKED",
  );
  if (labClashAfter)
    throw new Error("Lab Clash should be resolved and no longer present");
  console.log("✓ Lab Clash successfully resolved!");

  console.log("\n==========================================");
  console.log("🎉 ALL 4 VERIFICATION TESTS PASSED!");
  console.log("==========================================");
}

runVerification()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
