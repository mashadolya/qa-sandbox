export enum Role {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  INACTIVE = 'inactive',
}

/** Roles that can sign in (the inactive user is rejected). */
export type ActiveRole = Role.ADMIN | Role.ACCOUNTANT;

/** Every role that can sign in; `auth.setup.ts` saves a session for each. */
export const ACTIVE_ROLES: readonly ActiveRole[] = [Role.ACCOUNTANT, Role.ADMIN];
