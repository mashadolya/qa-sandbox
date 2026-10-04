/** UI languages, as the locale codes the app stores in the session. */
export enum Language {
  ENGLISH = 'en',
  NORSK = 'nb',
}

/** Names in the toolbar's language menu (the app does not translate them). */
export const LANGUAGE_NAMES: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.NORSK]: 'Norsk',
};
