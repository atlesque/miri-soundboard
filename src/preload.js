// Downloads recordings ahead of time so a press plays straight from memory.
// Each source is fetched once; the pad stays in its loading state until then.
export function createPreloader({ fetch, createObjectURL, onReady }) {
  const urls = new Map();
  const pending = new Map();
  const isReady = src => !src || urls.has(src);
  const urlFor = src => urls.get(src) ?? src;
  function load(src) {
    if (isReady(src)) return Promise.resolve();
    if (!pending.has(src)) {
      pending.set(src, (async () => {
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          urls.set(src, createObjectURL(await response.blob()));
        } catch {
          // Never leave a pad locked: fall back to streaming the original file.
          urls.set(src, src);
        }
        pending.delete(src);
        onReady(src);
      })());
    }
    return pending.get(src);
  }
  return { isReady, urlFor, load, loadAll: sources => Promise.all(sources.map(load)) };
}
