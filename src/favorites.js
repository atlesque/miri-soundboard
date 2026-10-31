// Favorites are personal to this browser, so they live in localStorage like the theme.
// Every access is guarded: storage can be missing or throw in private windows.
const FAVORITES_KEY = 'miri-favorites';
const FILTER_KEY = 'miri-favorites-only';
export const PAGE_SIZE = 9;

export function loadFavorites(storage) {
  try {
    const ids = JSON.parse(storage.getItem(FAVORITES_KEY) || '[]');
    return new Set(Array.isArray(ids) ? ids.filter(Number.isInteger) : []);
  } catch {
    return new Set();
  }
}

export function saveFavorites(storage, favorites) {
  try { storage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch {}
}

export function loadFavoritesOnly(storage) {
  try { return storage.getItem(FILTER_KEY) === 'true'; } catch { return false; }
}

export function saveFavoritesOnly(storage, value) {
  try { storage.setItem(FILTER_KEY, String(value)); } catch {}
}

// Favorites keep the board's order and fill pages of nine, so keys 1–9 still map to pads.
// There is always at least one (possibly empty) page.
export function favoritePages(sounds, favorites, size = PAGE_SIZE) {
  const chosen = sounds.filter(sound => favorites.has(sound.id));
  const pages = [];
  for (let i = 0; i < chosen.length; i += size) pages.push(chosen.slice(i, i + size));
  return pages.length ? pages : [[]];
}
