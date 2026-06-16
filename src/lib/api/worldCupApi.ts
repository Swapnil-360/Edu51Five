import { supabase } from "../supabase";

export interface WC26Match {
  id: string;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
  home_score: number | null;
  away_score: number | null;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | HALFTIME | FINISHED
  utc_date: string;
  stage: string | null;
  group_name: string | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  profile_pic: string | null;
  wc26_team: string;
  points: number;
}

export const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "HALFTIME"]);

const THROTTLE_NORMAL_MS = 5 * 60 * 1000; // 5 min when no live match
const THROTTLE_LIVE_MS   = 60 * 1000;     // 60 s during a live match
const LAST_SYNC_KEY      = "wc26_last_sync";
const HAD_LIVE_KEY       = "wc26_had_live";

export function isLiveMatch(m: WC26Match) {
  return LIVE_STATUSES.has(m.status);
}

export async function getWC26Matches(): Promise<WC26Match[]> {
  const { data, error } = await supabase
    .from("wc26_matches")
    .select("*")
    .order("utc_date", { ascending: true });
  if (error) return [];
  return data as WC26Match[];
}

/** Calls the edge function if the throttle allows. Returns whether any match is currently live. */
export async function syncWC26Matches(force = false): Promise<{ hasLive: boolean }> {
  const lastHadLive = localStorage.getItem(HAD_LIVE_KEY) === "true";
  const throttle = lastHadLive ? THROTTLE_LIVE_MS : THROTTLE_NORMAL_MS;

  if (!force) {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (lastSync && Date.now() - Number(lastSync) < throttle) {
      return { hasLive: lastHadLive };
    }
  }

  try {
    const { data } = await supabase.functions.invoke("sync-wc26-matches");
    const hasLive: boolean = data?.hasLive ?? false;
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    localStorage.setItem(HAD_LIVE_KEY, String(hasLive));
    return { hasLive };
  } catch {
    return { hasLive: lastHadLive };
  }
}

export function computePoints(teamCode: string, matches: WC26Match[]): number {
  let points = 0;
  for (const m of matches) {
    if (m.status !== "FINISHED") continue;
    const isHome = m.home_code === teamCode;
    const isAway = m.away_code === teamCode;
    if (!isHome && !isAway) continue;

    const teamGoals = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const oppGoals  = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);

    points += teamGoals; // +1 per goal scored
    if (teamGoals > oppGoals) points += 3;       // win
    else if (teamGoals === oppGoals) points += 1; // draw
  }
  return points;
}

export async function getWC26Leaderboard(
  matches: WC26Match[],
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,username,avatar_url,profile_pic,wc26_team")
    .not("wc26_team", "is", null);
  if (error || !data) return [];

  return (data as LeaderboardEntry[])
    .map((p) => ({ ...p, points: computePoints(p.wc26_team, matches) }))
    .sort((a, b) => b.points - a.points);
}
