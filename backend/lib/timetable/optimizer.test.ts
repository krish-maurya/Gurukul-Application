import { evaluateTimetable, TimetableSlotInput } from "./optimizer";

const slots: TimetableSlotInput[] = [
  {
    id: "one",
    day: "Mon",
    period: 1,
    grade: "Grade 10A",
    subjectId: "math",
    subjectName: "Math",
    teacherId: "teacher-a",
    teacherName: "Teacher A",
    roomId: "room-1",
    roomName: "Room 1",
    roomType: "LECTURE",
  },
  {
    id: "two",
    day: "Mon",
    period: 1,
    grade: "Grade 11A",
    subjectId: "science",
    subjectName: "Science",
    teacherId: "teacher-a",
    teacherName: "Teacher A",
    roomId: "room-2",
    roomName: "Room 2",
    roomType: "LECTURE",
  },
  {
    id: "three",
    day: "Mon",
    period: 2,
    grade: "Grade 10A",
    subjectId: "history",
    subjectName: "History",
    teacherId: "teacher-b",
    teacherName: "Teacher B",
    roomId: "room-1",
    roomName: "Room 1",
    roomType: "LECTURE",
  },
  {
    id: "four",
    day: "Mon",
    period: 2,
    grade: "Grade 11A",
    subjectId: "english",
    subjectName: "English",
    teacherId: "teacher-c",
    teacherName: "Teacher C",
    roomId: "room-1",
    roomName: "Room 1",
    roomType: "LECTURE",
  },
  {
    id: "five",
    day: "Tue",
    period: 3,
    grade: "Grade 12A",
    subjectId: "chem",
    subjectName: "Chemistry",
    teacherId: "teacher-d",
    teacherName: "Teacher D",
    roomId: "room-3",
    roomName: "Room 3",
    roomCapacity: 20,
    classSize: 30,
    roomType: "LECTURE",
  },
  {
    id: "six",
    day: "Wed",
    period: 4,
    grade: "Grade 9A",
    subjectId: "bio",
    subjectName: "Biology",
    teacherId: "teacher-e",
    teacherName: "Teacher E",
    roomId: "room-4",
    roomName: "Room 4",
    roomType: "LECTURE",
    requiresLab: true,
  },
  {
    id: "seven",
    day: "Thu",
    period: 2,
    grade: "Grade 9B",
    subjectId: "physics",
    subjectName: "Physics",
    teacherId: "teacher-f",
    teacherName: "Teacher F",
    roomId: "lab-1",
    roomName: "Lab 1",
    roomType: "LAB",
  },
  {
    id: "eight",
    day: "Thu",
    period: 2,
    grade: "Grade 9C",
    subjectId: "physics",
    subjectName: "Physics",
    teacherId: "teacher-g",
    teacherName: "Teacher G",
    roomId: "lab-1",
    roomName: "Lab 1",
    roomType: "LAB",
  },
];

const result = evaluateTimetable(slots);
const types = new Set(result.conflicts.map((conflict) => conflict.type));
for (const expected of [
  "TEACHER_CLASH",
  "ROOM_CLASH",
  "CAPACITY_EXCEEDED",
  "LAB_REQUIRED",
  "LAB_CLASH",
]) {
  if (!types.has(expected as never)) throw new Error(`Expected ${expected}`);
}
if (
  result.optimizedSlots !== slots ||
  result.conflicts.some(
    (conflict) =>
      !conflict.suggestedFix || !Array.isArray(conflict.possibleFreePeriods),
  )
) {
  throw new Error(
    "Expected deterministic suggestions without timetable mutation",
  );
}
console.log(
  "SUCCESS: teacher, room, lab, capacity, and suggestion constraints are deterministic.",
);
