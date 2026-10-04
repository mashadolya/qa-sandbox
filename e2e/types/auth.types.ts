import type { Role } from './user.types';

export interface User {
  email: string;
  password: string;
  displayName: string;
}

/** The session payload the app stores after sign-in (mirrors src/app/core/auth/session.service.ts). */
export interface SessionPayload {
  userId: string;
  role: Role;
  locale: string;
  displayName: string;
  exp: number;
}
