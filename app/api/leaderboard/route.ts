import { computeEtag } from "@/lib/etag";
import { validateEvaluations } from "@/lib/evaluation-validate";

/** The only place in this app that calls the mobile app's GET /evaluations
 * — see architecture.md invariant #2 (no direct DB access to the mobile
 * app, this API is the sole integration point). The upstream fetch itself
 * is never cached (clients need fresh data), but the response we hand
 * back supports conditional requests (ETag / If-None-Match): most 3s
 * polls land between evaluations, so returning 304 for those is what
 * actually keeps this affordable at that interval — see
 * lib/etag-fetcher.ts for the client side. */
export async function GET(request: Request) {
  const url = process.env.EVALUATIONS_API_URL;

  if (!url) {
    return Response.json(
      { error: "EVALUATIONS_API_URL n'est pas configurée." },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    return Response.json(
      { error: "Impossible de joindre l'API de l'application mobile." },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return Response.json(
      {
        error: `L'API de l'application mobile a répondu ${upstream.status}.`,
      },
      { status: 502 }
    );
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch {
    return Response.json(
      { error: "Réponse invalide (JSON) de l'API de l'application mobile." },
      { status: 502 }
    );
  }

  const evaluations = validateEvaluations(raw);
  const body = { evaluations };
  const etag = computeEtag(body);

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "private, no-cache" },
    });
  }

  return Response.json(body, {
    headers: { ETag: etag, "Cache-Control": "private, no-cache" },
  });
}
