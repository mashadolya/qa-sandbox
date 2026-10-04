/** Task statuses: keys under `taskStatus.*` and the `data-status` value on task rows and cards. */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/** Task priorities, as keys under `priority.*` in the app's translations. */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/** Data for the "New task" form on a client's page. */
export interface NewTask {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: TaskPriority;
}
