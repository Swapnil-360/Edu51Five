import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Trash2, X, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { listMessages, sendMessage, deleteMessage, setReaction, fetchProfiles } from "../../lib/api/chatApi";
import { TeamMessage, TeamMember } from "../../types/social";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥"];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function AvatarCircle({ name, avatarUrl, isOwn }: { name: string; avatarUrl: string | null; isOwn: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const color = isOwn ? "bg-blue-500" : nameToColor(name);
  const initial = name[0]?.toUpperCase() ?? "?";

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700/30"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color} text-white`}>
      {initial}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function isSameGroup(a: TeamMessage, b: TeamMessage): boolean {
  if (a.user_id !== b.user_id) return false;
  return Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60 * 1000;
}

interface Props {
  teamId: string;
  currentUserId: string;
  isMember: boolean;
  canManage: boolean;
  isAdmin?: boolean;
  isDarkMode: boolean;
  members: TeamMember[];
}

export default function TeamChat({ teamId, currentUserId, isMember, canManage, isAdmin = false, isDarkMode, members }: Props) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const dark = isDarkMode;
  const card = dark ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200";
  const inputBg = dark ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const msgOwn = dark ? "bg-blue-600 text-white" : "bg-blue-600 text-white";
  const msgOther = dark ? "bg-slate-800 text-slate-100 border border-slate-700/50" : "bg-white text-slate-900 border border-slate-200";
  const replyBg = dark ? "bg-slate-700/60" : "bg-slate-100";

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isMember) return;

    const load = async () => {
      setLoading(true);
      const msgs = await listMessages(teamId);
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollToBottom("instant"), 50);
    };
    load();

    // Realtime subscription
    channelRef.current = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        async (payload) => {
          const raw = payload.new as TeamMessage;
          // Fetch sender profile
          const profileMap = await fetchProfiles([raw.user_id]);
          // Fetch reply snippet if needed
          let reply_to: TeamMessage["reply_to"] = null;
          if (raw.reply_to_id) {
            const { data: replyRow } = await supabase
              .from("team_messages")
              .select("id, content, user_id")
              .eq("id", raw.reply_to_id)
              .single();
            if (replyRow) {
              const replyProfiles = await fetchProfiles([(replyRow as any).user_id]);
              reply_to = {
                id: (replyRow as any).id,
                content: (replyRow as any).content,
                sender_name: replyProfiles[(replyRow as any).user_id]?.name ?? "Unknown",
              };
            }
          }
          const msg: TeamMessage = {
            ...raw,
            sender: profileMap[raw.user_id],
            reply_to,
            reactions: [],
          };
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => scrollToBottom(), 50);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_message_reactions" },
        async (payload) => {
          const messageId =
            payload.eventType === "DELETE"
              ? (payload.old as any).message_id
              : (payload.new as any).message_id;
          if (!messageId) return;
          // Re-fetch reactions for this message
          const { data } = await supabase
            .from("team_message_reactions")
            .select("user_id, emoji")
            .eq("message_id", messageId);
          const reactionsMap: Record<string, string[]> = {};
          for (const r of (data ?? []) as any[]) {
            if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = [];
            reactionsMap[r.emoji].push(r.user_id);
          }
          const reactions = Object.entries(reactionsMap).map(([emoji, user_ids]) => ({ emoji, user_ids }));
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isMember]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");
    const replied = replyingTo;
    setReplyingTo(null);

    const mySenderProfile = members.find((m) => m.user_id === currentUserId)?.profile;

    // Optimistic: add message to UI immediately so sender sees it right away
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: TeamMessage = {
      id: optimisticId,
      team_id: teamId,
      user_id: currentUserId,
      content: trimmed,
      reply_to_id: replied?.id ?? null,
      created_at: new Date().toISOString(),
      sender: mySenderProfile,
      reply_to: replied
        ? { id: replied.id, content: replied.content, sender_name: replied.sender?.name ?? "Unknown" }
        : null,
      reactions: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(), 30);

    const saved = await sendMessage(teamId, currentUserId, trimmed, replied?.id);

    // Replace optimistic entry with the real DB row (has correct id/created_at)
    if (saved) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...saved, sender: mySenderProfile ?? saved.sender, reply_to: optimistic.reply_to } : m)));
    } else {
      // Failed — remove the optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (msg: TeamMessage) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteMessage(msg.id);
  };

  const handleReact = async (msgId: string, emoji: string) => {
    setHoveredId(null);
    // Optimistic: apply Messenger semantics locally (one reaction per user, swappable)
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        let reactions = (m.reactions ?? []).map((r) => ({ ...r, user_ids: [...r.user_ids] }));
        const hadSame = reactions.some((r) => r.emoji === emoji && r.user_ids.includes(currentUserId));
        // Remove my id from every emoji on this message
        reactions = reactions
          .map((r) => ({ ...r, user_ids: r.user_ids.filter((id) => id !== currentUserId) }))
          .filter((r) => r.user_ids.length > 0);
        // If I didn't already have this exact emoji, add it (otherwise it's a toggle-off)
        if (!hadSame) {
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) existing.user_ids.push(currentUserId);
          else reactions.push({ emoji, user_ids: [currentUserId] });
        }
        return { ...m, reactions };
      }),
    );
    await setReaction(msgId, currentUserId, emoji);
  };

  if (!isMember) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 gap-3 ${sub}`}>
        <MessageSquare className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">Join this team to see the chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${sub}`}>
        <span className="text-sm">Loading messages…</span>
      </div>
    );
  }

  // Group messages with date separators
  const items: ({ type: "date"; label: string } | { type: "message"; msg: TeamMessage; isFirst: boolean })[] = [];
  let lastDate = "";
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateLabel = formatDateLabel(msg.created_at);
    if (dateLabel !== lastDate) {
      items.push({ type: "date", label: dateLabel });
      lastDate = dateLabel;
    }
    const prev = messages[i - 1];
    const isFirst = !prev || !isSameGroup(prev, msg) || formatDateLabel(prev.created_at) !== dateLabel;
    items.push({ type: "message", msg, isFirst });
  }

  return (
    <div className={`flex flex-col rounded-2xl border overflow-hidden ${card}`} style={{ height: "calc(100dvh - 260px)", minHeight: 380 }}>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-0.5">
        {messages.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-full gap-2 ${sub}`}>
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">No messages yet — say hello!</p>
          </div>
        )}
        {items.map((item, idx) => {
          if (item.type === "date") {
            return (
              <div key={`date-${idx}`} className="flex items-center gap-3 py-3">
                <div className={`flex-1 h-px ${dark ? "bg-slate-700/50" : "bg-slate-200"}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>{item.label}</span>
                <div className={`flex-1 h-px ${dark ? "bg-slate-700/50" : "bg-slate-200"}`} />
              </div>
            );
          }

          const { msg, isFirst } = item;
          const isOwn = msg.user_id === currentUserId;
          const canDelete = isOwn || canManage || isAdmin;
          const senderName = msg.sender?.name ?? "Unknown";
          // Prefer Storage avatar_url, fall back to legacy base64 profile_pic
          const avatar = msg.sender?.avatar_url || msg.sender?.profile_pic || null;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : ""} ${isFirst ? "mt-3" : "mt-0.5"} group relative`}
              onMouseEnter={() => setHoveredId(msg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Avatar — shown for first message in every group, both own and others */}
              <div className="w-8 flex-shrink-0 self-end">
                {isFirst ? (
                  <AvatarCircle name={senderName} avatarUrl={avatar} isOwn={isOwn} />
                ) : (
                  <div className="w-8" />
                )}
              </div>

              <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[68%] sm:max-w-[58%]`}>
                {isFirst && (
                  <span className={`text-[11px] font-semibold mb-1 ${isOwn ? "mr-1 text-right" : "ml-1"} ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {isOwn ? "You" : senderName}
                  </span>
                )}

                {/* Reply quote */}
                {msg.reply_to && (
                  <div className={`text-[11px] px-2.5 py-1.5 rounded-lg mb-1 max-w-full border-l-2 border-blue-500 ${replyBg} ${sub} truncate`}>
                    <span className="font-semibold text-blue-500 mr-1">{msg.reply_to.sender_name}</span>
                    {msg.reply_to.content.slice(0, 80)}{msg.reply_to.content.length > 80 ? "…" : ""}
                  </div>
                )}

                {/* Bubble (with Messenger-style reaction badge anchored to bottom corner) */}
                <div className="relative">
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isOwn ? msgOwn : msgOther} ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"} ${msg.reactions && msg.reactions.length > 0 ? "mb-2.5" : ""}`}>
                    {msg.content}
                    <span className={`text-[10px] ml-2 opacity-60 align-baseline`}>{formatTime(msg.created_at)}</span>
                  </div>

                  {/* Reaction badge — overlaps the bubble's outer-bottom corner like Messenger */}
                  {msg.reactions && msg.reactions.length > 0 && (() => {
                    const total = msg.reactions.reduce((sum, r) => sum + r.user_ids.length, 0);
                    const iReacted = msg.reactions.some((r) => r.user_ids.includes(currentUserId));
                    return (
                      <button
                        onClick={() => {
                          const mine = msg.reactions!.find((r) => r.user_ids.includes(currentUserId));
                          handleReact(msg.id, mine ? mine.emoji : msg.reactions![0].emoji);
                        }}
                        title={msg.reactions.map((r) => `${r.emoji} ${r.user_ids.length}`).join("  ")}
                        className={`absolute -bottom-2.5 ${isOwn ? "right-1" : "left-1"} inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shadow-sm transition-transform hover:scale-105 ${
                          dark
                            ? `bg-slate-800 border border-slate-700 ${iReacted ? "ring-1 ring-blue-500/50" : ""}`
                            : `bg-white border border-slate-200 ${iReacted ? "ring-1 ring-blue-400" : ""}`
                        }`}
                        style={{ outline: dark ? "2px solid rgb(15 23 42)" : "2px solid white" }}
                      >
                        {msg.reactions.slice(0, 3).map((r) => (
                          <span key={r.emoji} className="text-xs leading-none">{r.emoji}</span>
                        ))}
                        {total > 1 && <span className={`text-[10px] font-semibold ml-0.5 ${dark ? "text-slate-300" : "text-slate-500"}`}>{total}</span>}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Hover action toolbar — shown above the bubble, all inline, no floating popup */}
              {hoveredId === msg.id && (
                <div className={`self-center flex items-center gap-0.5 px-1.5 py-1 rounded-xl shadow-md flex-shrink-0 ${dark ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
                  {REACTION_EMOJIS.map((emoji) => {
                    const mineHere = msg.reactions?.some((r) => r.emoji === emoji && r.user_ids.includes(currentUserId));
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(msg.id, emoji)}
                        className={`text-sm hover:scale-125 transition-transform px-0.5 rounded ${mineHere ? "bg-blue-500/20" : ""}`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                  <div className={`w-px h-4 mx-0.5 ${dark ? "bg-slate-600" : "bg-slate-200"}`} />
                  <button
                    onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                    className={`p-1 rounded-lg transition-colors ${dark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                    title="Reply"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(msg)}
                      className={`p-1 rounded-lg transition-colors ${dark ? "hover:bg-red-900/40 text-slate-400 hover:text-red-400" : "hover:bg-red-50 text-slate-500 hover:text-red-500"}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyingTo && (
        <div className={`flex items-center gap-2 px-3 py-2 border-t text-xs ${dark ? "border-slate-700/50 bg-slate-800/50 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
          <CornerDownLeft className="w-3 h-3 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-blue-500">{replyingTo.sender?.name ?? "Unknown"}: </span>
            <span className="truncate">{replyingTo.content.slice(0, 80)}{replyingTo.content.length > 80 ? "…" : ""}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="flex-shrink-0 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className={`flex items-end gap-2 p-3 border-t ${dark ? "border-slate-700/50" : "border-slate-200"}`}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className={`flex-1 resize-none px-3 py-2 rounded-xl text-sm border outline-none focus:border-blue-500 transition-colors ${inputBg}`}
          style={{ maxHeight: 120, overflowY: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
