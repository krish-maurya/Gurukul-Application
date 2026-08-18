# Gurukul — School Operations Platform

Gurukul is an AI-assisted school operating system for administrators, teachers, and parents. It centralises admissions, student records, attendance, timetable operations, fees, parent communication, documents, notifications, and an AI assistant.

## Product summary

- **Admin workspace:** operational dashboard, student registry, admissions OCR, staff, timetable management, fee setup, parent communication, document review, and important notifications.
- **Teacher workspace:** a focused first-login decision screen for taking attendance or opening a personal timetable. The selected task opens without the normal dashboard sidebar or AI assistant.
- **Parent portal:** private, token-based access to a child’s attendance, fees, timetable, and school messages.

## Core features

### Authentication and roles

- Secure Admin and Teacher login.
- Teacher accounts are linked to staff records.
- Role-based routing and permissions.
- Admin-only access to configuration, staff, and bulk operations.

### Student registry and admissions

- Central student profiles with class/division, roll number, parent contact, address, medical notes, prior school, fees, and attendance.
- Natural registry order: standard, division, then roll number, for example **10A → 10B → 11A**, each in roll-number order.
- OCR admission-document upload, field extraction, human review, and editable verification.
- **Approve & Create Record** creates an admitted student in the database.
- A successful OCR admission automatically creates and sends a parent-portal welcome/admission confirmation.
- Processing Queue is database-backed, not sample data.

### Attendance

- Class and date selection with roll-grid attendance marking.
- One attendance record per class/division per day.
- Teacher focus mode removes navigation, dashboard chrome, and Ask AI controls.
- Attendance is saved transactionally.
- Students marked absent automatically receive an absence notice in the parent portal. Email delivery can additionally be enabled through the configured mail provider.
- Attendance review identifies present and absent totals before submission.

### Timetable

- Weekly school timetable with day and period slots.
- Teacher timetable only exposes that teacher’s scheduled classes.
- Date picker and scheduling controls.
- Teacher focus timetable includes a clear **Go to Dashboard** action but no sidebar or AI assistant.
- Admin management for room assignments, conflicts, absences, proxy coverage, and schedule updates.
- Responsive date selector keeps “Schedule Date” on one line.

### Fees and parent communication

- Student fee accounts, payments, due dates, and overdue status.
- Class/division fee configuration and individual fee adjustments.
- Parent Connect supports Draft, Sent, Read, All, and Absent Students views.
- Search messages by student.
- Parent portal links can be generated and emailed.
- Fee reminders are generated from live fee-account data and should be scoped to the selected class/division when configured.

### Notifications

- Notification bell is reserved for operationally important events such as documents requiring review, admissions needing action, timetable/proxy issues, and parent-message events.
- The notification list is database-driven and refreshes automatically.

### Dashboard and AI

- Admin overview should report real database metrics: active student count, attendance status, outstanding fees, documents requiring review, timetable conflicts, and recent operational activity.
- Ask AI supports queries about attendance, students, staff, timetable, and school operations.
- Ask AI must never obscure critical task controls such as the attendance submission button.

## Technology

- Next.js 14, React, TypeScript
- Prisma ORM with PostgreSQL
- Tailwind CSS
- OCR with Tesseract
- Optional email delivery through Brevo
- Role-based server-side API authorization

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Clone the repository and install packages:
   ```bash
   npm install
   ```
3. Create `.env` from the required environment values:
   ```env
   DATABASE_URL="postgresql://..."
   JWT_SECRET="use-a-long-random-secret"
   BREVO_API_KEY="optional-for-email-delivery"
   ```
4. Generate the Prisma client and apply the schema:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
5. Start the application:
   ```bash
   npm run dev
   ```
6. Validate a production build:
   ```bash
   npm run build
   ```
