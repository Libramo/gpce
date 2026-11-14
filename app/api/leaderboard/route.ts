import { computeEtag } from "@/lib/etag";
import type { Evaluation } from "@/lib/evaluation-types";
import { validateEvaluations } from "@/lib/evaluation-validate";

/** The only place in this app that calls the mobile app's GET /evaluations
 * — see architecture.md invariant #2 (no direct DB access to the mobile
 * app, this API is the sole integration point).
 *
 * Two things keep the mobile app's database (Neon free tier, network
 * transfer is the limit that matters) out of the polling cost:
 *
 * 1. A shared server-side cache: every open screen polls this route, but
 *    the upstream is asked at most once per CACHE_MS per server instance,
 *    however many screens are open. Concurrent requests share one
 *    in-flight fetch.
 * 2. The upstream's `version`: we send back the version we already hold
 *    as `?since=`, and when nothing changed the mobile app answers
 *    `{ unchanged: true }` without reading the rows. An upstream that
 *    doesn't send `version` (older deploy) still works, just without (2).
 *
 * The response to the browser keeps its ETag / If-None-Match support (see
 * lib/etag-fetcher.ts for the client side). */

const CACHE_MS = 3000;

type Snapshot = {
  body: { evaluations: Evaluation[] };
  etag: string;
  version: string | null;
  fetchedAt: number;
};

class UpstreamError extends Error {}

let snapshot: Snapshot | null = null;
let inFlight: Promise<Snapshot> | null = null;

async function refresh(baseUrl: string): Promise<Snapshot> {
  const url = new URL(baseUrl);
  if (snapshot?.version) url.searchParams.set("since", snapshot.version);

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    throw new UpstreamError("Impossible de joindre l'API de l'application mobile.");
  }

  if (!upstream.ok) {
    throw new UpstreamError(
      `L'API de l'application mobile a répondu ${upstream.status}.`,
    );
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch {
    throw new UpstreamError(
      "Réponse invalide (JSON) de l'API de l'application mobile.",
    );
  }

  const record =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const version = typeof record.version === "string" ? record.version : null;

  if (record.unchanged === true && snapshot) {
    snapshot = { ...snapshot, version, fetchedAt: Date.now() };
    return snapshot;
  }

  const body = { evaluations: validateEvaluations(raw) };
  snapshot = { body, etag: computeEtag(body), version, fetchedAt: Date.now() };
  return snapshot;
}

function getSnapshot(baseUrl: string): Promise<Snapshot> {
  if (snapshot && Date.now() - snapshot.fetchedAt < CACHE_MS) {
    return Promise.resolve(snapshot);
  }
  if (!inFlight) {
    inFlight = refresh(baseUrl).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export async function GET(request: Request) {
  const url = process.env.EVALUATIONS_API_URL;

  if (!url) {
    return Response.json(
      { error: "EVALUATIONS_API_URL n'est pas configurée." },
      { status: 500 }
    );
  }

  let current: Snapshot;
  try {
    current = await getSnapshot(url);
  } catch (error) {
    const message =
      error instanceof UpstreamError
        ? error.message
        : "Erreur inattendue en lisant l'API de l'application mobile.";
    return Response.json({ error: message }, { status: 502 });
  }

  if (request.headers.get("if-none-match") === current.etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: current.etag, "Cache-Control": "private, no-cache" },
    });
  }

  return Response.json(current.body, {
    headers: { ETag: current.etag, "Cache-Control": "private, no-cache" },
  });
}
