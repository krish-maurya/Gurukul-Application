export type UserRole = "ADMIN" | "TEACHER";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  /** Linked Staff record id (teachers only) — used for "my timetable" rules */
  staffId?: string | null;
}

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  if (userRole === "ADMIN") return true;
  return userRole === requiredRole;
}
