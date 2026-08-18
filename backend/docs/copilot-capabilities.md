# GURUKUL Assistant Supported Tasks

The assistant only answers questions it can verify through authorized GURUKUL data or approved documents.

| Task                      | Example                                         | Access                                    |
| ------------------------- | ----------------------------------------------- | ----------------------------------------- |
| Student lookup            | `Show Sameer's profile`                         | Admin, Teacher (teacher scope)            |
| Class enrollment count    | `How many students in Grade 10A?`               | Admin, Teacher (teacher scope)            |
| Exact attendance status   | `Is Sameer present in Grade 10A on 28/09/2026?` | Admin, Teacher (teacher scope)            |
| Daily absences            | `Who was absent yesterday?`                     | Admin, Teacher (teacher scope)            |
| Attendance-risk list      | `Who is below 75% attendance?`                  | Admin, Teacher (teacher scope)            |
| Fee outstanding           | `Who has pending fees?`                         | Admin only                                |
| Policy/document retrieval | `What is the attendance policy?`                | Admin, Teacher                            |
| Class timetable           | `Show Grade 10A timetable on Monday`            | Admin, Teacher                            |
| Teacher schedule          | `Prof. Alan Turing's timetable` / `My schedule` | Admin, Teacher                            |
| Timetable conflicts       | `Any timetable clashes?`                        | Admin, Teacher                            |
| Faculty lookup            | `Who teaches in Physics department?`            | Admin, Teacher                            |
| School statistics         | `How many students are enrolled?`               | Admin, Teacher (scoped)                   |
| Authorized navigation     | `Open attendance`                               | Only routes permitted to the current role |

## Accuracy rules

- Dates in `DD/MM/YYYY` and `YYYY-MM-DD` formats are parsed into an exact stored date.
- A named attendance question checks an actual submitted `AttendanceEntry`, including `PRESENT` entries; it does not infer presence from an absence list.
- Timetable answers are loaded from `TimetableSlot` records and filtered by class, teacher, day, or subject when requested.
- No matching timetable entry produces a verified empty result with available class/teacher suggestions, never a fabricated schedule.
- Multiple matching students or teachers require clarification rather than a guess.
- Groq can polish evidence-backed language only. It cannot select database records, permissions, sources, or routes.

## Natural-language understanding

When `GROQ_API_KEY` is configured, Groq first maps informal or abbreviated phrasing into a constrained request intent and explicit fields before any database retrieval. For example, “What does Turing teach on Monday?” is normalized to a teacher/day timetable lookup. The database result—not the model—determines the answer. Unclear student names, teacher names, grades, and dates remain unresolved and result in a clarification or an unverified response.
