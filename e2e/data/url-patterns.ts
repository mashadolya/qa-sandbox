import { APP_ROUTES } from './app.routes';

/** Matches a URL that ends exactly at the given route (no sub-paths). */
const exact = (route: string): RegExp => new RegExp(`${route}$`);

/** URL patterns for `toHaveURL` assertions after navigation or a redirect. */
export const URL_PATTERNS = {
  LOGIN: exact(APP_ROUTES.LOGIN),
  DASHBOARD: exact(APP_ROUTES.DASHBOARD),
  CLIENT_LIST: exact(APP_ROUTES.CLIENTS),
};
