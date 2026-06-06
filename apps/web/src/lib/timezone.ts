/**
 * Timezone helpers for the election forms. The default mirrors the backend's
 * `DEFAULT_TIMEZONE` in `@eboto/backend/election-timing` — Philippine time.
 */
export const DEFAULT_TIMEZONE = 'Asia/Manila';

/** The browser's current IANA timezone, falling back to Philippine time. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Every IANA timezone name the runtime knows about, for the picker. */
export function listTimezones(): string[] {
  try {
    const values = Intl.supportedValuesOf('timeZone');
    return values.length > 0 ? values : [DEFAULT_TIMEZONE];
  } catch {
    return [DEFAULT_TIMEZONE];
  }
}
