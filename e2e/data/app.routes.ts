const CLIENTS = '/clients';

/** App routes as used in `page.goto`; mirrors src/app/app.routes.ts. */
export const APP_ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  CLIENTS,
  CLIENT_NEW: `${CLIENTS}/new`,
  CLIENT_VIEW: (id: string) => `${CLIENTS}/${id}`,
  CLIENT_EDIT: (id: string) => `${CLIENTS}/${id}/edit`,
  TASKS: '/tasks',
  TIME: '/time',
} as const;
