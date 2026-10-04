/** Hosts of the public APIs the app calls. */
export const BRREG_DOMAIN = 'data.brreg.no';
export const HOLIDAYS_DOMAIN = 'date.nager.at';
export const FX_DOMAIN = 'data.norges-bank.no';

/** Glob patterns for `page.route` / `context.route`; any other off-origin request is blocked in tests. */
export const BRREG_URL_PATTERN = `https://${BRREG_DOMAIN}/enhetsregisteret/api/enheter/**`;
export const HOLIDAYS_URL_PATTERN = `https://${HOLIDAYS_DOMAIN}/api/v3/PublicHolidays/**`;
export const FX_URL_PATTERN = `https://${FX_DOMAIN}/api/data/EXR/**`;
