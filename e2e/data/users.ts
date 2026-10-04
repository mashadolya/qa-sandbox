import { Role } from '../types/user.types';

export const USERS = {
  [Role.ADMIN]: {
    email: 'admin@qa.test',
    password: process.env.USER_ADMIN_PASSWORD ?? '',
    displayName: 'Kari Admin',
  },
  [Role.ACCOUNTANT]: {
    email: 'accountant@qa.test',
    password: process.env.USER_ACCOUNTANT_PASSWORD ?? '',
    displayName: 'Ola Regnskap',
  },
  [Role.INACTIVE]: { email: 'inactive@qa.test', password: 'nope', displayName: 'Per Inaktiv' },
} as const;
