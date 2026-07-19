/** A polling-friendly SWR fetcher: sends the last-seen ETag as
 * `If-None-Match`, and on a `304` reuses the previously-seen data — same
 * object reference, so SWR/React see no change and skip re-rendering —
 * instead of re-parsing and re-transferring the full payload. This is
 * what actually cuts bandwidth for a 3s poll interval; the interval
 * itself was never the expensive part (see architecture.md).
 *
 * Each call to this factory owns an independent ETag/data cache — call it
 * once per SWR key (e.g. via `useMemo(() => createEtagFetcher(), [])`),
 * not fresh on every render, or there's nothing to compare against. */
export function createEtagFetcher<T>(): (url: string) => Promise<T> {
  let lastEtag: string | null = null;
  let lastData: T | null = null;

  return async function fetchWithEtag(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: lastEtag ? { "If-None-Match": lastEtag } : undefined,
    });

    if (res.status === 304 && lastData !== null) {
      return lastData;
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? `Erreur ${res.status}`);
    }

    lastEtag = res.headers.get("ETag");
    lastData = data as T;
    return lastData;
  };
}
