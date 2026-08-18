import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding clean GURUKUL database...");

  // ============================================================
  // 1. CLEAN DATABASE
  // ============================================================

  await prisma.attendanceEntry.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.proxyAssignment.deleteMany();
  await prisma.teacherWorkload.deleteMany();
  await prisma.teacherLeave.deleteMany();
  await prisma.roomReservation.deleteMany();
  await prisma.staffSubject.deleteMany();
  await prisma.schedulingConstraint.deleteMany();
  await prisma.timetableConflict.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.documentRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.room.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  // 2. USERS
  // ============================================================

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const adminUser = await prisma.user.create({
    data: {
      id: "user-admin",
      name: "Dr. Eleanor Vance",
      email: "admin@gurukul.edu",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
  });
  console.log(`  Admin login -> admin@gurukul.edu / ${adminPassword}`);
  // NOTE: the Turing teacher account is created AFTER staff records exist (see below)

  // ============================================================
  // 3. STAFF / TEACHERS
  // ============================================================

  const staff = {
    turing: await prisma.staff.create({
      data: {
        id: "staff-turing",
        name: "Prof. Alan Turing",
        email: "turing@gurukul.edu",
        department: "Computer Science",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    ada: await prisma.staff.create({
      data: {
        id: "staff-ada",
        name: "Dr. Ada Lovelace",
        email: "ada@gurukul.edu",
        department: "Computer Science",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    grace: await prisma.staff.create({
      data: {
        id: "staff-grace",
        name: "Dr. Grace Hopper",
        email: "grace@gurukul.edu",
        department: "Computer Science",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    newton: await prisma.staff.create({
      data: {
        id: "staff-newton",
        name: "Sir Isaac Newton",
        email: "newton@gurukul.edu",
        department: "Mathematics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    ramanujan: await prisma.staff.create({
      data: {
        id: "staff-ramanujan",
        name: "Dr. Srinivasa Ramanujan",
        email: "ramanujan@gurukul.edu",
        department: "Mathematics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    katherine: await prisma.staff.create({
      data: {
        id: "staff-katherine",
        name: "Dr. Katherine Johnson",
        email: "katherine@gurukul.edu",
        department: "Mathematics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    bhaskara: await prisma.staff.create({
      data: {
        id: "staff-bhaskara",
        name: "Dr. Bhaskara",
        email: "bhaskara@gurukul.edu",
        department: "Mathematics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    curie: await prisma.staff.create({
      data: {
        id: "staff-curie",
        name: "Dr. Marie Curie",
        email: "curie@gurukul.edu",
        department: "Physics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    feynman: await prisma.staff.create({
      data: {
        id: "staff-feynman",
        name: "Prof. Richard Feynman",
        email: "feynman@gurukul.edu",
        department: "Physics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    faraday: await prisma.staff.create({
      data: {
        id: "staff-faraday",
        name: "Dr. Michael Faraday",
        email: "faraday@gurukul.edu",
        department: "Physics",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    darwin: await prisma.staff.create({
      data: {
        id: "staff-darwin",
        name: "Dr. Charles Darwin",
        email: "darwin@gurukul.edu",
        department: "Biology",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),

    mendel: await prisma.staff.create({
      data: {
        id: "staff-mendel",
        name: "Dr. Gregor Mendel",
        email: "mendel@gurukul.edu",
        department: "Biology",
        maxPeriodsPerDay: 4,
        maxPeriodsPerWeek: 20,
        maxProxiesPerDay: 2,
        isActive: true,
      },
    }),
  };

  // Teacher demo account linked to the Turing staff record
  await prisma.user.create({
    data: {
      id: "user-staff",
      name: "Prof. Alan Turing",
      email: "turing@gurukul.edu",
      passwordHash: await bcrypt.hash(
        process.env.SEED_TEACHER_PASSWORD || "teacher123",
        10,
      ),
      role: "TEACHER",
      staffId: staff.turing.id,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });
  console.log(
    `  Teacher login -> turing@gurukul.edu / ${process.env.SEED_TEACHER_PASSWORD || "teacher123"}`,
  );

  // ============================================================
  // 4. ROOMS
  // ============================================================

  const rooms = {
    r101: await prisma.room.create({
      data: {
        id: "room-101",
        roomNumber: "Room 101",
        building: "Main Academic Block",
        capacity: 40,
        type: "LECTURE",
        isAvailable: true,
      },
    }),

    r102: await prisma.room.create({
      data: {
        id: "room-102",
        roomNumber: "Room 102",
        building: "Main Academic Block",
        capacity: 35,
        type: "LECTURE",
        isAvailable: true,
      },
    }),

    r201: await prisma.room.create({
      data: {
        id: "room-201",
        roomNumber: "Room 201",
        building: "West Wing",
        capacity: 45,
        type: "LECTURE",
        isAvailable: true,
      },
    }),

    r202: await prisma.room.create({
      data: {
        id: "room-202",
        roomNumber: "Room 202",
        building: "West Wing",
        capacity: 35,
        type: "LECTURE",
        isAvailable: true,
      },
    }),

    labA: await prisma.room.create({
      data: {
        id: "room-lab-a",
        roomNumber: "Science Lab A",
        building: "Science Wing",
        capacity: 30,
        type: "LAB",
        isAvailable: true,
      },
    }),

    labB: await prisma.room.create({
      data: {
        id: "room-lab-b",
        roomNumber: "Science Lab B",
        building: "Science Wing",
        capacity: 30,
        type: "LAB",
        isAvailable: true,
      },
    }),
  };

  // ============================================================
  // 5. SUBJECTS
  // ============================================================

  const subjects = {
    math: await prisma.subject.create({
      data: {
        id: "subj-math",
        code: "MATH101",
        name: "Mathematics",
        weeklyPeriods: 4,
        requiresLab: false,
      },
    }),

    physics: await prisma.subject.create({
      data: {
        id: "subj-physics",
        code: "PHYS201",
        name: "Physics",
        weeklyPeriods: 4,
        requiresLab: false,
      },
    }),

    cs: await prisma.subject.create({
      data: {
        id: "subj-cs",
        code: "CS101",
        name: "Computer Science",
        weeklyPeriods: 4,
        requiresLab: true,
      },
    }),

    chemistry: await prisma.subject.create({
      data: {
        id: "subj-chem",
        code: "CHEM201",
        name: "Chemistry",
        weeklyPeriods: 4,
        requiresLab: true,
      },
    }),

    biology: await prisma.subject.create({
      data: {
        id: "subj-bio",
        code: "BIO101",
        name: "Biology",
        weeklyPeriods: 4,
        requiresLab: true,
      },
    }),
  };

  // ============================================================
  // 6. STAFF QUALIFICATIONS
  // ============================================================

  await prisma.staffSubject.createMany({
    data: [
      // Mathematics
      {
        staffId: staff.newton.id,
        subjectId: subjects.math.id,
        isPreferred: true,
      },
      {
        staffId: staff.ramanujan.id,
        subjectId: subjects.math.id,
        isPreferred: true,
      },
      {
        staffId: staff.katherine.id,
        subjectId: subjects.math.id,
        isPreferred: false,
      },
      {
        staffId: staff.bhaskara.id,
        subjectId: subjects.math.id,
        isPreferred: false,
      },
      {
        staffId: staff.turing.id,
        subjectId: subjects.math.id,
        isPreferred: false,
      },

      // Computer Science (Turing, Ada, Grace, Ramanujan)
      {
        staffId: staff.turing.id,
        subjectId: subjects.cs.id,
        isPreferred: true,
      },
      { staffId: staff.ada.id, subjectId: subjects.cs.id, isPreferred: true },
      { staffId: staff.grace.id, subjectId: subjects.cs.id, isPreferred: true },
      {
        staffId: staff.ramanujan.id,
        subjectId: subjects.cs.id,
        isPreferred: false,
      },

      // Physics
      {
        staffId: staff.curie.id,
        subjectId: subjects.physics.id,
        isPreferred: true,
      },
      {
        staffId: staff.feynman.id,
        subjectId: subjects.physics.id,
        isPreferred: true,
      },
      {
        staffId: staff.faraday.id,
        subjectId: subjects.physics.id,
        isPreferred: false,
      },

      // Chemistry
      {
        staffId: staff.curie.id,
        subjectId: subjects.chemistry.id,
        isPreferred: true,
      },
      {
        staffId: staff.feynman.id,
        subjectId: subjects.chemistry.id,
        isPreferred: false,
      },

      // Biology
      {
        staffId: staff.darwin.id,
        subjectId: subjects.biology.id,
        isPreferred: true,
      },
      {
        staffId: staff.mendel.id,
        subjectId: subjects.biology.id,
        isPreferred: true,
      },
      {
        staffId: staff.bhaskara.id,
        subjectId: subjects.biology.id,
        isPreferred: false,
      },
    ],
  });

  // ============================================================
  // 7. SCHEDULING CONSTRAINTS
  // ============================================================

  await prisma.schedulingConstraint.createMany({
    data: [
      { key: "proxy.scoring.free_slot", value: "40" },
      { key: "proxy.scoring.same_department", value: "20" },
      { key: "proxy.scoring.lowest_workload", value: "20" },
      { key: "proxy.scoring.no_previous_proxy", value: "10" },
      { key: "proxy.scoring.preferred_teacher", value: "10" },
      { key: "timetable.periods_per_day", value: "6" },
      { key: "timetable.max_periods_per_day", value: "6" },
      { key: "timetable.max_periods_per_week", value: "30" },
    ],
  });

  // ============================================================
  // 8. STUDENTS (25 students per grade)
  // ============================================================

  const grades = [
    "Grade 10A",
    "Grade 10B",
    "Grade 11A",
    "Grade 11B",
    "Grade 12A",
    "Grade 12B",
  ];

  const studentNames = [
    "Aarav Sharma",
    "Vivaan Patel",
    "Aditya Shah",
    "Anaya Mehta",
    "Ishaan Desai",
    "Diya Joshi",
    "Arjun Patel",
    "Myra Shah",
    "Kabir Mehta",
    "Sara Desai",
    "Reyansh Joshi",
    "Aadhya Patel",
    "Vihaan Shah",
    "Kiara Mehta",
    "Atharv Desai",
    "Riya Joshi",
    "Advait Patel",
    "Ira Shah",
    "Dhruv Mehta",
    "Navya Desai",
    "Rohan Verma",
    "Saanvi Reddy",
    "Aryan Gupta",
    "Ananya Rao",
    "Kavya Nair",
  ];

  const students = [];
  for (const grade of grades) {
    for (let i = 1; i <= 25; i++) {
      const name =
        i <= studentNames.length
          ? `${studentNames[i - 1]} (${grade.replace("Grade ", "")})`
          : `${grade} Student ${i}`;
      students.push({
        rollNumber: i,
        name,
        dob: `2009-${String(((i - 1) % 12) + 1).padStart(2, "0")}-${String(((i - 1) % 28) + 1).padStart(2, "0")}`,
        grade,
        parentName: `Parent of ${name}`,
        contact: `+91-980000${String(i).padStart(4, "0")}`,
        address: `${i} Campus Avenue`,
        medicalNotes: "None",
        previousSchool: "GURUKUL Junior School",
        status: "ADMITTED",
      });
    }
  }

  await prisma.student.createMany({ data: students });

  // ============================================================
  // 9. DOCUMENT RECORD
  // ============================================================

  await prisma.documentRecord.create({
    data: {
      id: "doc-aarav",
      fileName: "Admission_Form_Aarav_Sharma.pdf",
      documentType: "Admission Application",
      status: "APPROVED",
      confidenceScore: 95.0,
      rawText:
        "GURUKUL HIGH SCHOOL ADMISSION FORM\nStudent Name: Aarav Sharma\nApplying Grade: Grade 10A",
      extractedFields: JSON.stringify({
        studentName: { value: "Aarav Sharma", confidence: 98 },
        grade: { value: "Grade 10A", confidence: 95 },
      }),
      fileUrl: "/samples/admission_aarav.png",
    },
  });

  // ============================================================
  // 10. TIMETABLE
  // ============================================================
  //
  // Standard, clean, realistic schedule with EXACTLY TWO
  // intentional conflict cases:
  // 1. Room Clash on Monday Period 2 (Room 101 used by 10A and 11A)
  // 2. Lab Clash on Wednesday Period 2 (Science Lab A used by 10A and 11A)
  //
  // Turing's Monday Period 1 class (CS) is affected by his absence.
  // Candidates available and free at Mon P1: Ada, Grace, Ramanujan.

  const timetableData = [
    // ----------------------------------------------------------
    // MONDAY
    // ----------------------------------------------------------
    // Period 1: Turing's CS class (Subject to proxy test when Turing is absent)
    {
      id: "slot-mon-1-10a-cs",
      day: "Mon",
      period: 1,
      grade: "Grade 10A",
      subjectId: subjects.cs.id,
      teacherId: staff.turing.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-mon-1-11a-math",
      day: "Mon",
      period: 1,
      grade: "Grade 11A",
      subjectId: subjects.math.id,
      teacherId: staff.newton.id,
      roomId: rooms.r101.id,
    },

    // Period 2: INTENTIONAL ROOM CLASH (Room 101 double-booked)
    // Grade 10A Physics & Grade 11A Math both assigned to Room 101
    // Available lecture alternatives at Mon P2: Room 102, Room 201, Room 202
    {
      id: "slot-mon-2-10a-physics",
      day: "Mon",
      period: 2,
      grade: "Grade 10A",
      subjectId: subjects.physics.id,
      teacherId: staff.curie.id,
      roomId: rooms.r101.id,
    },
    {
      id: "slot-mon-2-11a-math",
      day: "Mon",
      period: 2,
      grade: "Grade 11A",
      subjectId: subjects.math.id,
      teacherId: staff.newton.id,
      roomId: rooms.r101.id,
    },

    // Period 3: Normal
    {
      id: "slot-mon-3-11b-cs",
      day: "Mon",
      period: 3,
      grade: "Grade 11B",
      subjectId: subjects.cs.id,
      teacherId: staff.ada.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-mon-3-12a-physics",
      day: "Mon",
      period: 3,
      grade: "Grade 12A",
      subjectId: subjects.physics.id,
      teacherId: staff.faraday.id,
      roomId: rooms.r201.id,
    },

    // Period 4: Normal
    {
      id: "slot-mon-4-10b-math",
      day: "Mon",
      period: 4,
      grade: "Grade 10B",
      subjectId: subjects.math.id,
      teacherId: staff.ramanujan.id,
      roomId: rooms.r102.id,
    },
    {
      id: "slot-mon-4-12a-chem",
      day: "Mon",
      period: 4,
      grade: "Grade 12A",
      subjectId: subjects.chemistry.id,
      teacherId: staff.feynman.id,
      roomId: rooms.labB.id,
    },

    // Period 5: Normal
    {
      id: "slot-mon-5-10a-bio",
      day: "Mon",
      period: 5,
      grade: "Grade 10A",
      subjectId: subjects.biology.id,
      teacherId: staff.darwin.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-mon-5-11a-math-katherine",
      day: "Mon",
      period: 5,
      grade: "Grade 11A",
      subjectId: subjects.math.id,
      teacherId: staff.katherine.id,
      roomId: rooms.r102.id,
    },

    // Period 6: Normal
    {
      id: "slot-mon-6-12a-cs",
      day: "Mon",
      period: 6,
      grade: "Grade 12A",
      subjectId: subjects.cs.id,
      teacherId: staff.grace.id,
      roomId: rooms.labB.id,
    },
    {
      id: "slot-mon-6-10b-bio",
      day: "Mon",
      period: 6,
      grade: "Grade 10B",
      subjectId: subjects.biology.id,
      teacherId: staff.mendel.id,
      roomId: rooms.labA.id,
    },

    // ----------------------------------------------------------
    // TUESDAY
    // ----------------------------------------------------------
    {
      id: "slot-tue-1-10a-math",
      day: "Tue",
      period: 1,
      grade: "Grade 10A",
      subjectId: subjects.math.id,
      teacherId: staff.ramanujan.id,
      roomId: rooms.r101.id,
    },
    {
      id: "slot-tue-2-11a-physics",
      day: "Tue",
      period: 2,
      grade: "Grade 11A",
      subjectId: subjects.physics.id,
      teacherId: staff.curie.id,
      roomId: rooms.r102.id,
    },
    {
      id: "slot-tue-3-12a-cs",
      day: "Tue",
      period: 3,
      grade: "Grade 12A",
      subjectId: subjects.cs.id,
      teacherId: staff.grace.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-tue-4-11b-math",
      day: "Tue",
      period: 4,
      grade: "Grade 11B",
      subjectId: subjects.math.id,
      teacherId: staff.bhaskara.id,
      roomId: rooms.r201.id,
    },
    {
      id: "slot-tue-5-10a-bio",
      day: "Tue",
      period: 5,
      grade: "Grade 10A",
      subjectId: subjects.biology.id,
      teacherId: staff.darwin.id,
      roomId: rooms.labB.id,
    },
    {
      id: "slot-tue-6-12b-physics",
      day: "Tue",
      period: 6,
      grade: "Grade 12B",
      subjectId: subjects.physics.id,
      teacherId: staff.faraday.id,
      roomId: rooms.r202.id,
    },

    // ----------------------------------------------------------
    // WEDNESDAY
    // ----------------------------------------------------------
    {
      id: "slot-wed-1-10a-math",
      day: "Wed",
      period: 1,
      grade: "Grade 10A",
      subjectId: subjects.math.id,
      teacherId: staff.newton.id,
      roomId: rooms.r101.id,
    },

    // Period 2: INTENTIONAL LAB CLASH (Science Lab A double-booked)
    // Grade 10A Computer Science & Grade 11A Chemistry both assigned to Lab A
    // Available lab alternative at Wed P2: Science Lab B
    {
      id: "slot-wed-2-10a-cs-lab",
      day: "Wed",
      period: 2,
      grade: "Grade 10A",
      subjectId: subjects.cs.id,
      teacherId: staff.turing.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-wed-2-11a-chem-lab",
      day: "Wed",
      period: 2,
      grade: "Grade 11A",
      subjectId: subjects.chemistry.id,
      teacherId: staff.curie.id,
      roomId: rooms.labA.id,
    },

    // Period 3: Normal
    {
      id: "slot-wed-3-11b-physics",
      day: "Wed",
      period: 3,
      grade: "Grade 11B",
      subjectId: subjects.physics.id,
      teacherId: staff.feynman.id,
      roomId: rooms.r201.id,
    },
    {
      id: "slot-wed-4-10b-cs",
      day: "Wed",
      period: 4,
      grade: "Grade 10B",
      subjectId: subjects.cs.id,
      teacherId: staff.ada.id,
      roomId: rooms.labB.id,
    },
    {
      id: "slot-wed-5-12b-math",
      day: "Wed",
      period: 5,
      grade: "Grade 12B",
      subjectId: subjects.math.id,
      teacherId: staff.katherine.id,
      roomId: rooms.r201.id,
    },

    // ----------------------------------------------------------
    // THURSDAY
    // ----------------------------------------------------------
    {
      id: "slot-thu-1-10a-physics",
      day: "Thu",
      period: 1,
      grade: "Grade 10A",
      subjectId: subjects.physics.id,
      teacherId: staff.faraday.id,
      roomId: rooms.r101.id,
    },
    {
      id: "slot-thu-2-11a-math",
      day: "Thu",
      period: 2,
      grade: "Grade 11A",
      subjectId: subjects.math.id,
      teacherId: staff.ramanujan.id,
      roomId: rooms.r201.id,
    },
    {
      id: "slot-thu-3-12a-cs",
      day: "Thu",
      period: 3,
      grade: "Grade 12A",
      subjectId: subjects.cs.id,
      teacherId: staff.grace.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-thu-4-10b-bio",
      day: "Thu",
      period: 4,
      grade: "Grade 10B",
      subjectId: subjects.biology.id,
      teacherId: staff.mendel.id,
      roomId: rooms.labB.id,
    },

    // ----------------------------------------------------------
    // FRIDAY
    // ----------------------------------------------------------
    {
      id: "slot-fri-1-11b-math",
      day: "Fri",
      period: 1,
      grade: "Grade 11B",
      subjectId: subjects.math.id,
      teacherId: staff.newton.id,
      roomId: rooms.r201.id,
    },
    {
      id: "slot-fri-2-12a-physics",
      day: "Fri",
      period: 2,
      grade: "Grade 12A",
      subjectId: subjects.physics.id,
      teacherId: staff.curie.id,
      roomId: rooms.r101.id,
    },
    {
      id: "slot-fri-3-10a-cs",
      day: "Fri",
      period: 3,
      grade: "Grade 10A",
      subjectId: subjects.cs.id,
      teacherId: staff.turing.id,
      roomId: rooms.labA.id,
    },
    {
      id: "slot-fri-4-11a-chem",
      day: "Fri",
      period: 4,
      grade: "Grade 11A",
      subjectId: subjects.chemistry.id,
      teacherId: staff.feynman.id,
      roomId: rooms.labB.id,
    },
  ];

  await prisma.timetableSlot.createMany({
    data: timetableData,
  });

  // ============================================================
  // 11. TEACHER LEAVES
  // ============================================================
  //
  // Monday 17 August 2026: Prof. Alan Turing is absent.
  // Affected class: Monday Period 1 Computer Science (Grade 10A)
  //

  await prisma.teacherLeave.create({
    data: {
      id: "leave-turing-2026-08-17",
      teacherId: staff.turing.id,
      date: "2026-08-17",
      status: "APPROVED",
      reason: "Medical leave",
    },
  });

  // ============================================================
  // 12. PROXY ASSIGNMENT (PENDING for Turing's Monday class)
  // ============================================================

  await prisma.proxyAssignment.create({
    data: {
      id: "proxy-turing-mon-p1",
      timetableSlotId: "slot-mon-1-10a-cs",
      absentTeacherId: staff.turing.id,
      date: "2026-08-17",
      status: "PENDING",
      recommendations: "[]",
    },
  });

  // ============================================================
  // 13. TEACHER WORKLOAD
  // ============================================================

  await prisma.teacherWorkload.createMany({
    data: [
      {
        teacherId: staff.turing.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.ada.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.grace.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.newton.id,
        date: "2026-08-17",
        lectureCount: 2,
        proxyCount: 0,
      },
      {
        teacherId: staff.ramanujan.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.curie.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.feynman.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.faraday.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.darwin.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.mendel.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.katherine.id,
        date: "2026-08-17",
        lectureCount: 1,
        proxyCount: 0,
      },
      {
        teacherId: staff.bhaskara.id,
        date: "2026-08-17",
        lectureCount: 0,
        proxyCount: 0,
      },
    ],
  });

  // ============================================================
  // 14. ATTENDANCE DATA
  // ============================================================

  const grade10Students = await prisma.student.findMany({
    where: { grade: "Grade 10A" },
    orderBy: { rollNumber: "asc" },
  });

  const attendanceRecord = await prisma.attendanceRecord.create({
    data: {
      id: "attendance-2026-08-12-10a",
      grade: "Grade 10A",
      section: "A",
      date: "2026-08-12",
      period: 1,
      takenByTeacherId: staff.turing.id,
      status: "SUBMITTED",
    },
  });

  await prisma.attendanceEntry.createMany({
    data: grade10Students.map((student) => ({
      attendanceRecordId: attendanceRecord.id,
      studentId: student.id,
      rollNumber: student.rollNumber,
      status:
        student.rollNumber === 7 || student.rollNumber === 19
          ? "ABSENT"
          : "PRESENT",
    })),
  });

  // ============================================================
  // 15. SUMMARY
  // ============================================================

  const [
    staffCount,
    subjectCount,
    roomCount,
    timetableCount,
    leaveCount,
    workloadCount,
    proxyCount,
  ] = await Promise.all([
    prisma.staff.count(),
    prisma.subject.count(),
    prisma.room.count(),
    prisma.timetableSlot.count(),
    prisma.teacherLeave.count(),
    prisma.teacherWorkload.count(),
    prisma.proxyAssignment.count(),
  ]);

  console.log("");
  console.log("==========================================");
  console.log("🎓 GURUKUL DATABASE SEEDED SUCCESSFULLY");
  console.log("==========================================");
  console.log(`Staff:             ${staffCount}`);
  console.log(`Subjects:          ${subjectCount}`);
  console.log(`Rooms:             ${roomCount}`);
  console.log(`Timetable Slots:   ${timetableCount}`);
  console.log(`Teacher Leaves:    ${leaveCount}`);
  console.log(`Teacher Workload:  ${workloadCount}`);
  console.log(`Proxy Assignments: ${proxyCount}`);
  console.log("==========================================");
  console.log("");
  console.log("🧪 TEST SCENARIOS:");
  console.log("1. Teacher Absence & Proxy Assignment (Test Date: 2026-08-17):");
  console.log("   - Prof. Alan Turing is absent on Monday 2026-08-17");
  console.log(
    "   - Affected lecture: Monday Period 1 (Grade 10A Computer Science)",
  );
  console.log(
    "   - Eligible & qualified CS candidates: Ada Lovelace, Grace Hopper, Srinivasa Ramanujan",
  );
  console.log("");
  console.log("2. Room Conflict Resolution:");
  console.log(
    "   - Monday Period 2: Room 101 double-booked (Grade 10A Physics & Grade 11A Math)",
  );
  console.log(
    "   - Available alternative lecture rooms: Room 102, Room 201, Room 202",
  );
  console.log("");
  console.log("3. Lab Conflict Resolution:");
  console.log(
    "   - Wednesday Period 2: Science Lab A double-booked (Grade 10A CS & Grade 11A Chem)",
  );
  console.log("   - Available alternative lab: Science Lab B");
  console.log("==========================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
