import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFavorites, saveFavorites, loadFavoritesOnly, saveFavoritesOnly, favoritePages } from '../src/favorites.js';
import { allSounds } from '../src/sounds.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
}

test('favorites and the filter round-trip through storage', () => {
  const storage = memoryStorage();
  assert.deepEqual([...loadFavorites(storage)], []);
  assert.equal(loadFavoritesOnly(storage), false);
  saveFavorites(storage, new Set([3, 21]));
  saveFavoritesOnly(storage, true);
  assert.deepEqual([...loadFavorites(storage)], [3, 21]);
  assert.equal(loadFavoritesOnly(storage), true);
});

test('missing, blocked, or corrupt storage falls back to no favorites', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  for (const storage of [undefined, blocked]) {
    assert.deepEqual([...loadFavorites(storage)], []);
    assert.equal(loadFavoritesOnly(storage), false);
    assert.doesNotThrow(() => saveFavorites(storage, new Set([1])));
    assert.doesNotThrow(() => saveFavoritesOnly(storage, true));
  }
  const corrupt = memoryStorage();
  corrupt.setItem('miri-favorites', '{not json');
  assert.deepEqual([...loadFavorites(corrupt)], []);
  corrupt.setItem('miri-favorites', '[1,"2",null,4.5,7]');
  assert.deepEqual([...loadFavorites(corrupt)], [1, 7]);
});

test('favorite pages keep board order, hold nine pads each, and ignore unknown ids', () => {
  assert.deepEqual(favoritePages(allSounds, new Set()), [[]]);
  assert.deepEqual(favoritePages(allSounds, new Set([999])), [[]]);
  const ids = allSounds.slice(0, 11).map(sound => sound.id).reverse();
  const pages = favoritePages(allSounds, new Set(ids));
  assert.deepEqual(pages.map(page => page.length), [9, 2]);
  assert.deepEqual(pages.flat().map(sound => sound.id), allSounds.slice(0, 11).map(sound => sound.id));
});
