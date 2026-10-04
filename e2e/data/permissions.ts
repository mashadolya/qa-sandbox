import { ActiveRole, Role } from '../types/user.types';
import { NavLink } from '../types/navigation.types';
import { ClientAction } from '../types/client.types';

// What each role is allowed to see, per README: the Accountant can view clients
// but cannot create/edit/delete them, cannot delete time entries and cannot
// manage users. Tests read the expectations from here instead of repeating them.

/** Toolbar links shown to each role; every other link must be hidden. */
export const NAV_LINKS: Record<ActiveRole, NavLink[]> = {
  [Role.ADMIN]: [NavLink.DASHBOARD, NavLink.CLIENTS, NavLink.TASKS, NavLink.TIME, NavLink.USERS],
  [Role.ACCOUNTANT]: [NavLink.DASHBOARD, NavLink.CLIENTS, NavLink.TASKS, NavLink.TIME],
};

/** Actions in a client row's menu for each role. */
export const CLIENT_ROW_ACTIONS: Record<ActiveRole, ClientAction[]> = {
  [Role.ADMIN]: [ClientAction.VIEW, ClientAction.EDIT, ClientAction.DELETE],
  [Role.ACCOUNTANT]: [ClientAction.VIEW],
};
