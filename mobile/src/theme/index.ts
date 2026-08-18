export const Colors = {
  canvas: '#f4f5f7',
  surface: '#ffffff',
  soft: '#f0f2f5',
  hover: '#f7f8fa',
  ink: '#111312',
  muted: '#687170',
  faint: '#9aa3a1',
  line: 'rgba(17, 19, 18, 0.1)',
  lineStrong: 'rgba(17, 19, 18, 0.15)',
  accent: '#1e3a8a',
  accentSoft: '#e9edff',
  accentText: '#172a66',
  accentGlow: 'rgba(30, 58, 138, 0.08)',
  green: '#0b9f6e',
  greenSoft: '#e6f8f1',
  greenText: '#087f58',
  amber: '#b7791f',
  amberSoft: '#fff6e0',
  amberText: '#8a5a10',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  redText: '#7f1d1d',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
};

export const FontSize = {
  xs: 9,
  sm: 10,
  base: 12,
  md: 13,
  lg: 15,
  xl: 18,
  xxl: 22,
  xxxl: 26,
};

export type UserRole = 'ADMIN' | 'TEACHER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  staffId?: string | null;
}