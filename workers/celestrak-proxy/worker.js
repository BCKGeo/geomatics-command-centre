export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=14400",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
