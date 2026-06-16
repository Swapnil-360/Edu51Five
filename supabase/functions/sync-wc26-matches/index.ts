import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type ApiMatch = {
  id: number;
  homeTeam: { tla: string; name: string };
  awayTeam: { tla: string; name: string };
  score: {
    fullTime:    { home: number | null; away: number | null };
    regularTime: { home: number | null; away: number | null } | null;
    halfTime:    { home: number | null; away: number | null };
  };
  status: string;
  utcDate: string;
  stage: string;
  group: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("FOOTBALL_API_KEY");
  if (!apiKey) return json({ error: "FOOTBALL_API_KEY secret not set" }, 500);

  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("football-data.org error:", res.status, errText);
      return json({ error: `API error ${res.status}` }, 502);
    }

    const { matches } = await res.json() as { matches: ApiMatch[] };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "HALFTIME"]);

    const rows = matches.map((m) => {
      const isLive = LIVE_STATUSES.has(m.status);
      // Use regularTime (current live score) during play; fall back to fullTime for finished
      const scoreSource = isLive && m.score.regularTime
        ? m.score.regularTime
        : m.score.fullTime;

      return {
        id: String(m.id),
        home_team: m.homeTeam.name,
        away_team: m.awayTeam.name,
        home_code: m.homeTeam.tla,
        away_code: m.awayTeam.tla,
        home_score: scoreSource.home,
        away_score: scoreSource.away,
        status: m.status,
        utc_date: m.utcDate,
        stage: m.stage,
        group_name: m.group,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("wc26_matches")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Supabase upsert error:", error);
      return json({ error: error.message }, 500);
    }

    const liveCount = rows.filter((r) => LIVE_STATUSES.has(r.status)).length;
    return json({ synced: rows.length, liveCount, hasLive: liveCount > 0 });
  } catch (e) {
    console.error("sync-wc26-matches error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
