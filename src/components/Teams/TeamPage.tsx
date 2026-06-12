import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Crown,
  Loader2,
  LogOut,
  Megaphone,
  Plus,
  Settings,
  Shield,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Team,
  TeamMember,
  TeamAnnouncement,
  TeamJoinRequest,
  TEAM_CATEGORY_LABELS,
} from "../../types/social";
import {
  getTeam,
  listTeamMembers,
  listAnnouncements,
  listTeamJoinRequests,
  postAnnouncement,
  deleteAnnouncement,
  respondToJoinRequest,
  removeMember,
  setMemberRole,
  updateTeam,
  deleteTeam,
} from "../../lib/api/teamsApi";
import InviteMembersModal from "./InviteMembersModal";
import { uploadImage } from "../../lib/storage";

type Tab = "overview" | "members";

interface Props {
  teamId: string;
  currentUserId: string;
  onClose: () => void;
  onViewProfile: (username: string) => void;
  isDarkMode: boolean;
}

export default function TeamPage({ teamId, currentUserId, onClose, onViewProfile, isDarkMode }: Props) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const myMembership = members.find((m) => m.user_id === currentUserId);
  const myRole = myMembership?.role ?? null;
  const canManage = myRole === "owner" || myRole === "admin";
  const isMember = !!myMembership;

  const load = async () => {
    setLoading(true);
    const t = await getTeam(teamId);
    setTeam(t);
    if (t) {
      const mems = await listTeamMembers(teamId);
      setMembers(mems);
      const me = mems.find((m) => m.user_id === currentUserId);
      if (me) {
        listAnnouncements(teamId).then(setAnnouncements);
        if (me.role === "owner" || me.role === "admin") {
          listTeamJoinRequests(teamId).then(setJoinRequests);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const pageBg = isDarkMode ? "bg-slate-950" : "bg-slate-100";
  const card = isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200";
  const title = isDarkMode ? "text-white" : "text-slate-900";
  const sub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputCls = `w-full px-3 py-2 rounded-lg text-sm border outline-none ${
    isDarkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
  }`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${pageBg}`}>
        <p className={title}>Team not found.</p>
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Go Back</button>
      </div>
    );
  }

  const submitAnnouncement = async () => {
    if (!annTitle.trim()) return;
    setBusy("ann");
    await postAnnouncement(teamId, currentUserId, annTitle.trim(), annBody.trim() || undefined);
    setAnnTitle("");
    setAnnBody("");
    setShowAnnForm(false);
    setAnnouncements(await listAnnouncements(teamId));
    setBusy(null);
  };

  const handleJoinRequest = async (req: TeamJoinRequest, approve: boolean) => {
    setBusy(req.id);
    await respondToJoinRequest(req.id, approve);
    await load();
    setBusy(null);
  };

  const handleTeamImageUpload = async (file: File, kind: "banner" | "logo") => {
    const maxMB = kind === "banner" ? 5 : 2;
    if (file.size > maxMB * 1024 * 1024) {
      setUploadError(`${kind === "banner" ? "Cover photo" : "Logo"} must be under ${maxMB}MB.`);
      return;
    }
    setUploadError(null);
    kind === "banner" ? setUploadingBanner(true) : setUploadingLogo(true);
    try {
      const url = await uploadImage("team-assets", team!.id, kind, file);
      await updateTeam(team!.id, kind === "banner" ? { banner_url: url } : { logo_url: url });
      await load();
    } catch (e: any) {
      setUploadError(e?.message ?? "Upload failed. Try again.");
    } finally {
      kind === "banner" ? setUploadingBanner(false) : setUploadingLogo(false);
    }
  };

  const roleBadge = (role: string) =>
    role === "owner" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
        <Crown className="w-3 h-3" /> Owner
      </span>
    ) : role === "admin" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500">
        <Shield className="w-3 h-3" /> Admin
      </span>
    ) : (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
        Member
      </span>
    );

  return (
    <div className={`min-h-screen pb-12 ${pageBg}`}>
      <div className={`sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b backdrop-blur ${isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`font-bold flex-1 truncate ${title}`}>{team.name}</h1>
        {canManage && (
          <>
            <button
              onClick={() => setShowInvite(true)}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Invite
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}
              title="Team settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Banner + identity */}
      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          {/* Banner with logo straddling its bottom edge */}
          <div className="relative">
            <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative">
              {team.banner_url && (
                <img src={team.banner_url} alt="" className="w-full h-full object-cover" />
              )}
              {canManage && (
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors"
                  title="Upload cover photo (max 5MB)"
                >
                  {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              )}
            </div>
            {/* Logo with camera overlay */}
            <div className={`absolute bottom-0 left-5 translate-y-1/2 w-20 h-20 relative`}>
              <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg ${isDarkMode ? "border-slate-900" : "border-white"}`}>
                {team.logo_url ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" /> : team.name.charAt(0).toUpperCase()}
              </div>
              {canManage && (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Upload logo (max 2MB)"
                >
                  {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
              )}
            </div>
          </div>
          <div className="px-5 pb-5 pt-14">
            <h2 className={`text-xl font-bold ${title}`}>{team.name}</h2>
            <p className={`text-sm mt-0.5 ${sub}`}>
              {TEAM_CATEGORY_LABELS[team.category]} · {members.length}/{team.max_members} members
            </p>
            {team.description && <p className={`text-sm mt-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{team.description}</p>}
            {team.goal && (
              <p className={`text-sm mt-2 flex items-start gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                <Target className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                {team.goal}
              </p>
            )}
            {team.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {team.required_skills.map((s) => (
                  <span key={s} className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${isDarkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            {uploadError}
            <button onClick={() => setUploadError(null)} className="ml-3 text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* Join requests (owner/admin) */}
        {canManage && joinRequests.length > 0 && (
          <div className={`rounded-2xl border p-5 ${isDarkMode ? "bg-amber-900/10 border-amber-700/40" : "bg-amber-50 border-amber-200"}`}>
            <h3 className={`text-sm font-bold mb-3 ${title}`}>Join Requests ({joinRequests.length})</h3>
            <div className="space-y-2">
              {joinRequests.map((req) => (
                <div key={req.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg ${isDarkMode ? "bg-slate-900/60" : "bg-white"}`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${title}`}>{req.user_profile?.name ?? "User"}</p>
                    {req.message && <p className={`text-xs truncate ${sub}`}>"{req.message}"</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleJoinRequest(req, true)}
                      disabled={busy === req.id}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                    >
                      {busy === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                    </button>
                    <button
                      onClick={() => handleJoinRequest(req, false)}
                      disabled={busy === req.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Overview | Members */}
        <div className="flex gap-2">
          {(["overview", "members"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t === "overview" ? "Overview" : `Members (${members.length})`}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          /* Announcements */
          <section className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold flex items-center gap-2 ${title}`}>
                <Megaphone className="w-5 h-5 text-orange-500" /> Announcements
              </h3>
              {canManage && (
                <button onClick={() => setShowAnnForm(!showAnnForm)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10">
                  {showAnnForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>

            {showAnnForm && (
              <div className={`mb-4 p-3 rounded-xl border space-y-2 ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                <input className={inputCls} value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title…" maxLength={150} />
                <textarea className={`${inputCls} min-h-[60px] resize-y`} value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Details (optional)…" maxLength={2000} />
                <button
                  onClick={submitAnnouncement}
                  disabled={busy === "ann" || !annTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {busy === "ann" && <Loader2 className="w-4 h-4 animate-spin" />} Post
                </button>
              </div>
            )}

            {!isMember ? (
              <p className={`text-sm ${sub}`}>Join this team to see announcements.</p>
            ) : announcements.length === 0 ? (
              <p className={`text-sm ${sub}`}>No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className={`p-3 rounded-xl border ${isDarkMode ? "border-slate-700/60 bg-slate-800/40" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${title}`}>{a.title}</p>
                        {a.body && <p className={`text-xs mt-1 whitespace-pre-wrap ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{a.body}</p>}
                        <p className={`text-[11px] mt-1.5 ${sub}`}>
                          {a.author_profile?.name ?? "Admin"} · {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          onClick={async () => {
                            await deleteAnnouncement(a.id);
                            setAnnouncements(await listAnnouncements(teamId));
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          /* Members */
          <section className={`rounded-2xl border p-5 ${card}`}>
            <h3 className={`text-base font-bold flex items-center gap-2 mb-4 ${title}`}>
              <Users className="w-5 h-5 text-blue-500" /> Members
            </h3>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <button
                    onClick={() => m.profile?.username && onViewProfile(m.profile.username)}
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold"
                  >
                    {m.profile?.avatar_url || m.profile?.profile_pic ? (
                      <img src={m.profile.avatar_url || m.profile.profile_pic!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      m.profile?.name?.charAt(0)?.toUpperCase() ?? "?"
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => m.profile?.username && onViewProfile(m.profile.username)}
                        className={`text-sm font-semibold truncate hover:underline ${title}`}
                      >
                        {m.profile?.name ?? "User"}
                        {m.user_id === currentUserId && " (you)"}
                      </button>
                      {roleBadge(m.role)}
                    </div>
                    <p className={`text-xs truncate ${sub}`}>{m.profile?.headline || [m.profile?.section, m.profile?.major].filter(Boolean).join(" · ")}</p>
                  </div>

                  {/* role management */}
                  {myRole === "owner" && m.role !== "owner" && (
                    <button
                      onClick={async () => {
                        setBusy(m.user_id);
                        await setMemberRole(teamId, m.user_id, m.role === "admin" ? "member" : "admin");
                        await load();
                        setBusy(null);
                      }}
                      disabled={busy === m.user_id}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${isDarkMode ? "bg-slate-800 text-blue-400 hover:bg-slate-700" : "bg-slate-100 text-blue-600 hover:bg-slate-200"}`}
                    >
                      {m.role === "admin" ? "Demote" : "Make Admin"}
                    </button>
                  )}
                  {canManage && m.role === "member" && m.user_id !== currentUserId && (
                    <button
                      onClick={async () => {
                        setBusy(`k-${m.user_id}`);
                        await removeMember(teamId, m.user_id);
                        await load();
                        setBusy(null);
                      }}
                      disabled={busy === `k-${m.user_id}`}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                      title="Remove member"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {/* Leave team */}
            {isMember && myRole !== "owner" && (
              <button
                onClick={async () => {
                  setBusy("leave");
                  await removeMember(teamId, currentUserId);
                  setBusy(null);
                  onClose();
                }}
                disabled={busy === "leave"}
                className="mt-5 px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Leave Team
              </button>
            )}
          </section>
        )}
      </div>

      {/* Hidden file inputs for banner/logo upload */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleTeamImageUpload(file, "banner");
          e.target.value = "";
        }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleTeamImageUpload(file, "logo");
          e.target.value = "";
        }}
      />

      {showInvite && (
        <InviteMembersModal team={team} currentUserId={currentUserId} isDarkMode={isDarkMode} onClose={() => setShowInvite(false)} />
      )}
      {showSettings && (
        <TeamSettingsModal
          team={team}
          isOwner={myRole === "owner"}
          isDarkMode={isDarkMode}
          onClose={() => setShowSettings(false)}
          onSaved={load}
          onDeleted={onClose}
        />
      )}
    </div>
  );
}

// ── Settings modal (edit / delete) ──────────────────────────────────────────

function TeamSettingsModal({
  team,
  isOwner,
  isDarkMode,
  onClose,
  onSaved,
  onDeleted,
}: {
  team: Team;
  isOwner: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [goal, setGoal] = useState(team.goal ?? "");
  const [maxMembers, setMaxMembers] = useState(team.max_members);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full px-3 py-2 rounded-lg text-sm border outline-none ${
    isDarkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
  }`;
  const labelCls = `block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`;

  const save = async () => {
    if (name.trim().length < 3) {
      setError("Team name must be at least 3 characters.");
      return;
    }
    setSaving(true);
    const { error: err } = await updateTeam(team.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      goal: goal.trim() || undefined,
      max_members: maxMembers,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    const { error: err } = await deleteTeam(team.id);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
          <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Team Settings</h3>
          <button onClick={onClose} className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
          <div>
            <label className={labelCls}>Team Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div>
            <label className={labelCls}>Goal</label>
            <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} />
          </div>
          <div>
            <label className={labelCls}>Max Members (2-7)</label>
            <input
              type="number"
              min={2}
              max={7}
              className={inputCls}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Math.min(7, Math.max(2, parseInt(e.target.value || "5", 10))))}
            />
          </div>

          {isOwner && (
            <div className={`pt-3 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-500 flex-1">Delete this team permanently?</p>
                  <button onClick={handleDelete} disabled={saving} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium">
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className={`px-3 py-1.5 rounded-lg text-xs ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Team
                </button>
              )}
            </div>
          )}
        </div>
        <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
