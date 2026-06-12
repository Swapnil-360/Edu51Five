import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Search, UserCheck, UserPlus, UserX, X } from "lucide-react";
import { Connection, SocialProfile } from "../../types/social";
import {
  listMyConnections,
  respondToRequest,
  removeConnection,
  searchUsers,
  sendConnectionRequest,
} from "../../lib/api/connectionsApi";
import UserCard from "./UserCard";

type Tab = "connections" | "requests" | "discover";

interface Props {
  currentUserId: string;
  onClose: () => void;
  onViewProfile: (username: string) => void;
  isDarkMode: boolean;
}

export default function NetworkPage({ currentUserId, onClose, onViewProfile, isDarkMode }: Props) {
  const [tab, setTab] = useState<Tab>("connections");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // discover state
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    setLoading(true);
    const conns = await listMyConnections(currentUserId);
    setConnections(conns);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const accepted = connections.filter((c) => c.status === "accepted");
  const incoming = connections.filter((c) => c.status === "pending" && c.addressee_id === currentUserId);
  const outgoing = connections.filter((c) => c.status === "pending" && c.requester_id === currentUserId);

  const runSearch = async () => {
    setSearching(true);
    const skills = skillFilter.trim() ? skillFilter.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const found = await searchUsers(
      { query: query.trim() || undefined, skills, excludeIds: [currentUserId] },
      30,
    );
    setResults(found);
    setSearching(false);
  };

  useEffect(() => {
    if (tab === "discover") runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const connStateFor = (userId: string): Connection | undefined =>
    connections.find((c) => c.requester_id === userId || c.addressee_id === userId);

  const handleAction = async (fn: () => Promise<{ error: string | null }>, key: string) => {
    setBusy(key);
    setActionError(null);
    const result = await fn();
    if (result?.error) setActionError(result.error);
    await load();
    setBusy(null);
  };

  const pageBg = isDarkMode ? "bg-slate-950" : "bg-slate-100";
  const title = isDarkMode ? "text-white" : "text-slate-900";
  const sub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputCls = `px-3 py-2 rounded-lg text-sm border outline-none ${
    isDarkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
  }`;

  const tabBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        tab === t
          ? "bg-blue-600 text-white"
          : isDarkMode
            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t ? "bg-white/20" : "bg-red-500 text-white"}`}>
          {count}
        </span>
      )}
    </button>
  );

  const viewProfile = (p: SocialProfile) => {
    if (p.username) onViewProfile(p.username);
  };

  return (
    <div className={`min-h-screen pb-12 ${pageBg}`}>
      <div className={`sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b backdrop-blur ${isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`font-bold ${title}`}>My Network</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabBtn("connections", "Connections", accepted.length)}
          {tabBtn("requests", "Requests", incoming.length)}
          {tabBtn("discover", "Discover")}
        </div>

        {actionError && (
          <div className="mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            {actionError}
            <button onClick={() => setActionError(null)} className="ml-3 text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : tab === "connections" ? (
          <div className="space-y-3">
            {accepted.length === 0 && (
              <p className={`text-sm text-center py-10 ${sub}`}>
                No connections yet. Head to <button className="text-blue-500 hover:underline" onClick={() => setTab("discover")}>Discover</button> to find people.
              </p>
            )}
            {accepted.map((c) =>
              c.other_profile ? (
                <UserCard
                  key={c.id}
                  profile={c.other_profile}
                  isDarkMode={isDarkMode}
                  onView={viewProfile}
                  action={
                    <button
                      onClick={() => handleAction(() => removeConnection(c.id), c.id)}
                      disabled={busy === c.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        isDarkMode ? "bg-slate-800 text-slate-400 hover:text-red-400" : "bg-slate-100 text-slate-500 hover:text-red-500"
                      }`}
                    >
                      {busy === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                      Remove
                    </button>
                  }
                />
              ) : null,
            )}
          </div>
        ) : tab === "requests" ? (
          <div className="space-y-5">
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${title}`}>Incoming ({incoming.length})</h3>
              <div className="space-y-3">
                {incoming.length === 0 && <p className={`text-sm ${sub}`}>No pending requests.</p>}
                {incoming.map((c) =>
                  c.other_profile ? (
                    <UserCard
                      key={c.id}
                      profile={c.other_profile}
                      isDarkMode={isDarkMode}
                      onView={viewProfile}
                      action={
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAction(() => respondToRequest(c.id, true), c.id)}
                            disabled={busy === c.id}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                          >
                            {busy === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(() => respondToRequest(c.id, false), `r-${c.id}`)}
                            disabled={busy === `r-${c.id}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      }
                    />
                  ) : null,
                )}
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${title}`}>Sent ({outgoing.length})</h3>
              <div className="space-y-3">
                {outgoing.length === 0 && <p className={`text-sm ${sub}`}>No outgoing requests.</p>}
                {outgoing.map((c) =>
                  c.other_profile ? (
                    <UserCard
                      key={c.id}
                      profile={c.other_profile}
                      isDarkMode={isDarkMode}
                      onView={viewProfile}
                      action={
                        <button
                          onClick={() => handleAction(() => removeConnection(c.id), c.id)}
                          disabled={busy === c.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            isDarkMode ? "bg-slate-800 text-slate-400 hover:text-red-400" : "bg-slate-100 text-slate-500 hover:text-red-500"
                          }`}
                        >
                          Cancel
                        </button>
                      }
                    />
                  ) : null,
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Discover */
          <div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                className={`${inputCls} flex-1`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search by name, username, headline…"
              />
              <input
                className={`${inputCls} flex-1`}
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Skills (comma separated)"
              />
              <button
                onClick={runSearch}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2 justify-center"
              >
                <Search className="w-4 h-4" /> Search
              </button>
            </div>

            {searching ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {results.length === 0 && <p className={`text-sm text-center py-10 ${sub}`}>No users found.</p>}
                {results.map((p) => {
                  const existing = connStateFor(p.id);
                  return (
                    <UserCard
                      key={p.id}
                      profile={p}
                      isDarkMode={isDarkMode}
                      onView={viewProfile}
                      action={
                        existing ? (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            existing.status === "accepted"
                              ? isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                              : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                          }`}>
                            {existing.status === "accepted" ? "Connected" : "Pending"}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAction(() => sendConnectionRequest(currentUserId, p.id), p.id)}
                            disabled={busy === p.id}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                          >
                            {busy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                            Connect
                          </button>
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
