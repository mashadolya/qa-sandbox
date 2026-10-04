import path from 'node:path';
import type { Page } from '@playwright/test';
import type { SessionPayload } from '../types/auth.types';
import type { Language } from '../types/language.types';
import type { Role } from '../types/user.types';

/** localStorage key the app keeps the signed session under (see session.service.ts). */
export const SESSION_STORAGE_KEY = 'qa.session';

/** Where `auth.setup.ts` stores the signed-in session per role and UI language. */
export function getAuthFilePath(role: Role, language: Language): string {
  return path.join(__dirname, '..', '.auth', `${role}.${language}.json`);
}

/** The signed-in session the app stored for this page, or null when signed out. */
export async function readSession(page: Page): Promise<SessionPayload | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SESSION_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { payload: SessionPayload }).payload : null;
}
