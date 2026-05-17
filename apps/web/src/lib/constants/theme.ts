/**
 * Theme constants. Storage key is shared between the React provider (writer)
 * and the inline `<head>` bootstrap script (reader) so they stay in sync.
 */

export const THEME_STORAGE_KEY = 'eboto-theme';

/**
 * Tiny script that runs in `<head>` before paint to set the `dark` class on
 * `<html>` based on stored preference / OS — prevents the flash of light
 * theme on dark-mode users when SSR can't know the client preference.
 */
export const THEME_BOOTSTRAP: string = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var theme = stored === 'light' || stored === 'dark' ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  } catch (_) {}
})();
`.trim();
