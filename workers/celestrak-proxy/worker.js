const ALLOWED_ORIGINS = new Set([
  "https://dashboard.bckgeo.ca",
  "https://geomatics-command-centre.pages.dev",
  "http://localhost:5173",
]);

function allowedOriginOrNull(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = allowedOriginOrNull(request);

    // Fail closed: reject requests from unknown origins instead of
    // stamping a default. Previous behavior exposed the worker to any
    // caller with any Origin header.
    if (!origin) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const groups = (url.searchParams.get("groups") || "gps-ops").split(",");
    const allowed = new Set(["gps-ops", "glo-ops", "galileo", "beidou"]);
    const filtered = groups.filter((g) => allowed.has(g));

    if (filtered.length === 0) {
      return new Response(JSON.stringify({ error: "No valid groups" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
      });
    }

    try {
      const results = await Promise.all(
        filtered.map((g) =>
          fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${g}&FORMAT=json`)
            .then((r) => {
              if (!r.ok) throw new Error(`Celestrak ${r.status}`);
              return r.json();
            })
        )
      );

      return new Response(JSON.stringify(results.flat()), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Cache-Control": "public, max-age=14400",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
      });
    }
  },
};
