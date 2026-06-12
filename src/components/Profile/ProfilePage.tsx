import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { SocialProfile, Education, Experience, Connection } from "../../types/social";
import {
  getProfileById,
  getProfileByUsername,
  getLegacyProfilePic,
  listEducations,
  listExperiences,
  updateProfile,
} from "../../lib/api/profileApi";
import {
  sendConnectionRequest,
  respondToRequest,
  removeConnection,
  listMyConnections,
} from "../../lib/api/connectionsApi";
import { uploadImage } from "../../lib/storage";
import EditBasicInfoModal from "./EditBasicInfoModal";
import EducationSection from "./EducationSection";
import ExperienceSection from "./ExperienceSection";
import SkillsEditor, { BadgeList } from "./SkillsEditor";

interface Props {
  /** username when viewing someone else via /u/:username; null = own profile */
  username: string | null;
  currentUserId: string | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function ProfilePage({ username, currentUserId, onClose, isDarkMode }: Props) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [legacyPic, setLegacyPic] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const isOwn = !!profile && !!currentUserId && profile.id === currentUserId;

  const load = async () => {
    setLoading(true);
    let p: SocialProfile | null = null;
    if (username) {
      p = await getProfileByUsername(username);
    } else if (currentUserId) {
      p = await getProfileById(currentUserId);
    }
    setProfile(p);
    setLoading(false);
    if (!p) return;

    // sections + connection state in parallel (non-blocking for first paint)
    listEducations(p.id).then(setEducations);
    listExperiences(p.id).then(setExperiences);
    if (!p.avatar_url) {
      getLegacyProfilePic(p.id).then(setLegacyPic);
    }
    if (currentUserId) {
      listMyConnections(currentUserId).then((conns) => {
        setConnectionCount(conns.filter((c) => c.status === "accepted").length);
        if (p && p.id !== currentUserId) {
          setConnection(
            conns.find(
              (c) => c.requester_id === p!.id || c.addressee_id === p!.id,
            ) ?? null,
          );
        }
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, currentUserId]);

  const refreshProfile = async () => {
    if (!profile) return;
    const p = await getProfileById(profile.id);
    if (p) setProfile(p);
  };

  const handleImageUpload = async (kind: "avatar" | "cover", file: File) => {
    if (!profile || !isOwn) return;
    setBusy(true);
    try {
      const url = await uploadImage("avatars", profile.id, kind, file);
      await updateProfile(profile.id, kind === "avatar" ? { avatar_url: url } : { cover_photo_url: url });
      if (kind === "avatar") {
        localStorage.setItem("userProfilePic", url);
        localStorage.setItem("userProfileAvatarUrl", url);
      }
      await refreshProfile();
    } catch (e: any) {
      console.error("Image upload failed:", e?.message ?? e);
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = async () => {
    if (!profile || !currentUserId) return;
    setBusy(true);
    if (!connection) {
      await sendConnectionRequest(currentUserId, profile.id);
    } else if (connection.status === "pending" && connection.addressee_id === currentUserId) {
      await respondToRequest(connection.id, true);
    } else {
      await removeConnection(connection.id);
    }
    const conns = await listMyConnections(currentUserId);
    setConnection(conns.find((c) => c.requester_id === profile.id || c.addressee_id === profile.id) ?? null);
    setBusy(false);
  };

  const saveTags = async (field: "skills" | "interests", items: string[]) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: items });
    await updateProfile(profile.id, { [field]: items });
  };

  const pageBg = isDarkMode ? "bg-slate-950" : "bg-slate-100";
  const card = isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200";
  const titleCls = isDarkMode ? "text-white" : "text-slate-900";
  const sub = isDarkMode ? "text-slate-400" : "text-slate-500";

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${pageBg}`}>
        <p className={titleCls}>Profile not found.</p>
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
          Go Back
        </button>
      </div>
    );
  }

  // Privacy gate (RLS already protects child tables; this gates the page shell)
  if (!isOwn && profile.visibility === "private") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${pageBg}`}>
        <Lock className={`w-10 h-10 ${sub}`} />
        <p className={titleCls}>This profile is private.</p>
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const avatarSrc = profile.avatar_url || legacyPic || "";
  const connectLabel = !connection
    ? "Connect"
    : connection.status === "accepted"
      ? "Connected"
      : connection.addressee_id === currentUserId
        ? "Accept Request"
        : "Request Sent";
  const ConnectIcon = !connection ? UserPlus : connection.status === "accepted" ? UserCheck : connection.addressee_id === currentUserId ? UserCheck : UserX;

  return (
    <div className={`min-h-screen pb-12 ${pageBg}`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b backdrop-blur ${isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`font-bold ${titleCls}`}>{isOwn ? "My Profile" : profile.name}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        {/* Header card */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          {/* Cover */}
          <div className="relative h-36 sm:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
            {profile.cover_photo_url && (
              <img src={profile.cover_photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {isOwn && (
              <button
                onClick={() => coverInput.current?.click()}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                title="Change cover photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="relative -mt-12 mb-3 w-24 h-24">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isDarkMode ? "border-slate-900 bg-slate-800" : "border-white bg-slate-200"}`}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-violet-600">
                    {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              {isOwn && (
                <button
                  onClick={() => avatarInput.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h2 className={`text-xl font-bold ${titleCls}`}>{profile.name}</h2>
                {profile.username && <p className={`text-sm ${sub}`}>@{profile.username}</p>}
                {profile.headline && (
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{profile.headline}</p>
                )}
                <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs ${sub}`}>
                  {profile.section && <span>{profile.section}</span>}
                  {profile.major && <span>· {profile.major}</span>}
                  {profile.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                  )}
                  {isOwn && (
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{connectionCount} connection{connectionCount === 1 ? "" : "s"}</span>
                  )}
                </div>
                {/* Links */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                  {Object.entries(profile.social_links ?? {}).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline capitalize">
                      <LinkIcon className="w-3 h-3" /> {k}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {isOwn ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Edit Profile
                  </button>
                ) : currentUserId ? (
                  <button
                    onClick={handleConnect}
                    disabled={busy || (connection?.status === "pending" && connection.requester_id === currentUserId)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      connection?.status === "accepted"
                        ? isDarkMode
                          ? "bg-slate-800 text-emerald-400 border border-emerald-700/50"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    }`}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ConnectIcon className="w-4 h-4" />}
                    {connectLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        {(isOwn || profile.about) && (
          <section className={`rounded-2xl border p-5 ${card}`}>
            <h3 className={`text-base font-bold mb-2 ${titleCls}`}>About</h3>
            {profile.about ? (
              <p className={`text-sm whitespace-pre-wrap ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{profile.about}</p>
            ) : (
              <p className={`text-sm ${sub}`}>
                Tell people about yourself —{" "}
                <button onClick={() => setShowEditModal(true)} className="text-blue-500 hover:underline">add an about section</button>.
              </p>
            )}
          </section>
        )}

        {/* Skills */}
        <section className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-bold ${titleCls}`}>Skills</h3>
            {isOwn && (
              <button
                onClick={() => setEditingSkills(!editingSkills)}
                className="text-xs text-blue-500 hover:underline"
              >
                {editingSkills ? "Done" : "Edit"}
              </button>
            )}
          </div>
          {editingSkills ? (
            <SkillsEditor items={profile.skills} onChange={(items) => saveTags("skills", items)} isDarkMode={isDarkMode} />
          ) : (
            <BadgeList items={profile.skills} isDarkMode={isDarkMode} emptyText={isOwn ? "Add skills so teams can find you." : "No skills listed."} />
          )}
        </section>

        {/* Interests */}
        <section className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-bold ${titleCls}`}>Interests</h3>
            {isOwn && (
              <button
                onClick={() => setEditingInterests(!editingInterests)}
                className="text-xs text-blue-500 hover:underline"
              >
                {editingInterests ? "Done" : "Edit"}
              </button>
            )}
          </div>
          {editingInterests ? (
            <SkillsEditor
              items={profile.interests}
              onChange={(items) => saveTags("interests", items)}
              isDarkMode={isDarkMode}
              badgeColor="purple"
              placeholder="Add an interest…"
            />
          ) : (
            <BadgeList items={profile.interests} isDarkMode={isDarkMode} badgeColor="purple" emptyText={isOwn ? "Add interests like AI, Research, Web Development…" : "No interests listed."} />
          )}
        </section>

        <EducationSection userId={profile.id} educations={educations} isOwn={isOwn} isDarkMode={isDarkMode} onChanged={() => listEducations(profile.id).then(setEducations)} />
        <ExperienceSection userId={profile.id} experiences={experiences} isOwn={isOwn} isDarkMode={isDarkMode} onChanged={() => listExperiences(profile.id).then(setExperiences)} />
      </div>

      {/* hidden file inputs */}
      <input
        ref={avatarInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload("avatar", f);
          e.target.value = "";
        }}
      />
      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload("cover", f);
          e.target.value = "";
        }}
      />

      {showEditModal && (
        <EditBasicInfoModal
          profile={profile}
          isDarkMode={isDarkMode}
          onClose={() => setShowEditModal(false)}
          onSaved={refreshProfile}
        />
      )}
    </div>
  );
}
