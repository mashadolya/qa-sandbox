/** Client statuses, as keys under `status.*` in the app's translations. */
export enum ClientStatus {
  ONBOARDING = 'onboarding',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  INACTIVE = 'inactive',
}

/** Actions in a client row's menu, as keys under `clients.*` in the app's translations. */
export enum ClientAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
}

/** Sortable client table columns, as the table reports them in `data-sort-column`. */
export type SortColumn = 'name' | 'organizationNumber' | 'status';
