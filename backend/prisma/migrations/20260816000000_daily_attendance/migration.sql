-- Attendance is recorded once per class and section for each calendar day.
CREATE UNIQUE INDEX "AttendanceRecord_grade_section_date_key"
ON "AttendanceRecord"("grade", "section", "date");
