import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, Plus, Search } from "lucide-react";
import {
  Team,
  TeamCategory,
  TeamInvitation,
  TeamJoinRequest,
  TEAM_CATEGORY_LABELS,
} from "../../types/social";
import {
  discoverTeams,
  listMyTeams,
  listMyInvitations,
  listMyJoinRequests,
  requestToJoin,
  respondToInvitation,
  cancelJoinRequest,
} from "../../lib/api/teamsApi";
import TeamCard from "./TeamCard";
import CreateTeamModal from "./CreateTeamModal";

type Tab = "discover" | "mine";

interface Props {
  currentUserId: string;
  onClose: () => void;
  onOpenTeam: (teamId: string) => void;
  isDarkMode: boolean;
}

export default function TeamsPage({ currentUserId, onClose, onOpenTeam, isDarkMode }: Props) {
  const [tab, setTab] = useState<Tab>("discover");
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [myRequests, setMyRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TeamCategory | "">("");
  const [skillFilter, setSkillFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const [discovered, mine, invs, reqs] = await Promise.all([
      discoverTeams({}),
      listMyTeams(currentUserId),
      listMyInvitations(currentUserId),
      listMyJoinRequests(currentUserId),
    ]);
    setTeams(discovered);
    setMyTeams(mine);
    setInvitations(invs);
    setMyRequests(reqs);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const runSearch = async () => {
    setLoading(true);
    const skills = skillFilter.trim() ? skillFilter.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    setTeams(await discoverTeams({ query: query.trim() || undefined, category: category || undefined as any, skills }));
    setLoading(false);
  };

  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const pendingReqByTeam = new Map(myRequests.map((r) => [r.team_id, r]));

  const pageBg = isDarkMode ? "bg-slate-950" : "bg-slate-100";
  const title = isDarkMode ? "text-white" : "text-slate-900";
  const sub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputCls = `px-3 py-2 rounded-lg text-sm border outline-none ${
    isDarkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
  }`;

  const handleJoinAction = async (team: Team) => {
    setBusy(team.id);
    const existing = pendingReqByTeam.get(team.id);
    if (existing) {
      await cancelJoinRequest(existing.id);
    } else {
      await requestToJoin(team.id, currentUserId);
    }
    setMyRequests(await listMyJoinRequests(currentUserId));
    setBusy(null);
  };

  const handleInvitation = async (inv: TeamInvitation, accept: boolean) => {
    setBusy(inv.id);
    await respondToInvitation(inv.id, accept);
    await load();
    setBusy(null);
  };

  return (
    <div className={`min-h-screen pb-12 ${pageBg}`}>
      <div className={`sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b backdrop-blur ${isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`font-bold flex-1 ${title}`}>Team Building</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Pending invitations strip */}
        {invitations.length > 0 && (
          <div className={`rounded-xl border p-4 mb-5 ${isDarkMode ? "bg-blue-900/20 border-blue-700/40" : "bg-blue-50 border-blue-200"}`}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${title}`}>
              <Mail className="w-4 h-4 text-blue-500" /> Team Invitations ({invitations.length})
            </h3>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg ${isDarkMode ? "bg-slate-900/60" : "bg-white"}`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${title}`}>{inv.team?.name ?? "Team"}</p>
                    <p className={`text-xs truncate ${sub}`}>
                      Invited by {inv.inviter_profile?.name ?? "someone"}
                      {inv.message && ` — "${inv.message}"`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleInvitation(inv, true)}
                      disabled={busy === inv.id}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                    >
                      {busy === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                    </button>
                    <button
                      onClick={() => handleInvitation(inv, false)}
                      disabled={busy === inv.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["discover", "mine"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t === "discover" ? "Discover Teams" : `My Teams (${myTeams.length})`}
            </button>
          ))}
        </div>

        {tab === "discover" && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className={`${inputCls} flex-1`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search teams…"
            />
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as TeamCategory | "")}>
              <option value="">All categories</option>
              {Object.entries(TEAM_CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              className={`${inputCls} flex-1`}
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Skills (comma separated)"
            />
            <button onClick={runSearch} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2 justify-center">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(tab === "discover" ? teams : myTeams).length === 0 && (
              <p className={`text-sm text-center py-10 col-span-full ${sub}`}>
                {tab === "discover" ? "No teams found. Create the first one!" : "You haven't joined any teams yet."}
              </p>
            )}
            {(tab === "discover" ? teams : myTeams).map((team) => {
              const isMember = myTeamIds.has(team.id);
              const pendingReq = pendingReqByTeam.get(team.id);
              const isFull = (team.member_count ?? 0) >= team.max_members;
              return (
                <TeamCard
                  key={team.id}
                  team={isMember ? { ...team, my_role: myTeams.find((t) => t.id === team.id)?.my_role ?? team.my_role } : team}
                  isDarkMode={isDarkMode}
                  onOpen={(t) => onOpenTeam(t.id)}
                  action={
                    tab === "discover" ? (
                      isMember ? (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                          Member
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinAction(team)}
                          disabled={busy === team.id || (isFull && !pendingReq)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            pendingReq
                              ? isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          }`}
                        >
                          {busy === team.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          {pendingReq ? "Cancel Request" : isFull ? "Full" : "Request to Join"}
                        </button>
                      )
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTeamModal
          currentUserId={currentUserId}
          isDarkMode={isDarkMode}
          onClose={() => setShowCreate(false)}
          onCreated={(team) => onOpenTeam(team.id)}
        />
      )}
    </div>
  );
}
