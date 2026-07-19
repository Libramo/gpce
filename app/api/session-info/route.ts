import { computeEtag } from "@/lib/etag";
import { validateSessionInfo } from "@/lib/session-info-validate";

/** The only place that calls the mobile app's /health endpoint — same
 * pattern as /api/leaderboard for /evaluations, including ETag support
 * (see there for why). This one polls every 30s and returns a tiny
 * payload, so the savings are smaller, but it's free to keep consistent. */
export async function GET(request: Request) {
  const url = process.env.HEALTH_API_URL;

  if (!url) {
    return Response.json(
      { error: "HEALTH_API_URL n'est pas configurée." },
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

  const sessionInfo = validateSessionInfo(raw);
  if (!sessionInfo) {
    return Response.json(
      { error: "Réponse de /health illisible (jurorCount/projectCount)." },
      { status: 502 }
    );
  }

  const etag = computeEtag(sessionInfo);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "private, no-cache" },
    });
  }

  return Response.json(sessionInfo, {
    headers: { ETag: etag, "Cache-Control": "private, no-cache" },
  });
}
