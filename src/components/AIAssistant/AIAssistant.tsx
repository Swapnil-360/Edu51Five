import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { sendChatMessage, type ChatTurn } from "../../lib/api/aiChatApi";

// Full-viewport fixed overlay — position:absolute children are always viewport-anchored,
// bypassing any body flex/transform context that breaks position:fixed on Android Chrome.
function getPortalRoot(): HTMLElement {
  let el = document.getElementById("ai-assistant-portal");
  if (!el) {
    el = document.createElement("div");
    el.id = "ai-assistant-portal";
    el.style.cssText = [
      "position:fixed",
      "top:0", "left:0", "right:0", "bottom:0",
      "width:100%", "height:100%",
      "z-index:9999",
      "pointer-events:none",
      "overflow:hidden",
    ].join(";");
    document.documentElement.appendChild(el); // attach to <html>, not flex <body>
  }
  return el;
}

interface Props {
  isDarkMode: boolean;
  userId: string;
}

interface Message {
  role: "user" | "model";
  text: string;
}

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const STORAGE_PREFIX = "edu51five_ai_chat_";
const MAX_HISTORY_TURNS = 10;

const WELCOME: Message = {
  role: "model",
  text: "Hey! Ask me anything about the platform or your coursework — I'll keep it brief.",
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm w-fit bg-white/[0.06] border border-white/[0.07]">
    {[0, 1, 2].map((d) => (
      <motion.span
        key={d}
        className="w-1.5 h-1.5 rounded-full bg-violet-400"
        animate={{ scale: [1, 1.4, 1], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 0.85, repeat: Infinity, delay: d * 0.17 }}
      />
    ))}
  </div>
);

export function AIAssistant({ isDarkMode: dk, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storageKey = `${STORAGE_PREFIX}${userId}`;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        if (parsed[0]?.role === "model") parsed[0] = WELCOME;
        setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch { /* storage full */ }
  }, [messages, storageKey]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    if (open) setTimeout(() => scrollToBottom("instant"), 50);
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history: ChatTurn[] = messages
      .filter((m) => m !== WELCOME)
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    setTimeout(() => scrollToBottom(), 30);

    try {
      const reply = await sendChatMessage(text, history);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      const isLimit = err instanceof Error && err.message === "daily_limit";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: isLimit
            ? "You've reached today's limit of 30 messages. Come back tomorrow!"
            : "Something went wrong on my end. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Using absolute positioning inside the full-viewport fixed overlay.
  // This is bulletproof on Android Chrome where position:fixed children
  // of a flex body are unreliable.
  const BTN_SIZE = 56;
  const BTN_RIGHT = 24;
  const BTN_BOTTOM = 24;
  const PANEL_RIGHT = 24;
  const PANEL_BOTTOM = BTN_BOTTOM + BTN_SIZE + 14; // 14px gap above button

  return createPortal(
    <>
      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: PANEL_BOTTOM,
              right: PANEL_RIGHT,
              width: 340,
              maxWidth: "calc(100vw - 48px)",
              height: 480,
              maxHeight: "calc(100vh - 140px)",
              pointerEvents: "auto",
            }}
          >
            {/* Ambient glow behind panel */}
            <div
              style={{
                position: "absolute",
                inset: -12,
                borderRadius: 24,
                background: "linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)",
                opacity: 0.18,
                filter: "blur(28px)",
                pointerEvents: "none",
              }}
            />

            {/* Panel */}
            <div
              className={cls(
                "relative w-full h-full rounded-2xl flex flex-col overflow-hidden border",
                dk ? "bg-[#0c0e1c] border-white/[0.08]" : "bg-white border-violet-200/50",
              )}
              style={{
                boxShadow: "0 20px 56px rgba(79,70,229,0.2), 0 0 0 1px rgba(124,58,237,0.12)",
              }}
            >
              {/* Header */}
              <div
                className={cls(
                  "flex items-center justify-between px-4 py-3 border-b flex-shrink-0",
                  dk ? "border-white/[0.07]" : "border-violet-100/70",
                )}
                style={{
                  background: dk
                    ? "linear-gradient(90deg,rgba(124,58,237,0.08),rgba(79,70,229,0.05),rgba(37,99,235,0.08))"
                    : "linear-gradient(90deg,rgba(124,58,237,0.05),rgba(79,70,229,0.03))",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2"
                      style={{ borderColor: dk ? "#0c0e1c" : "#ffffff" }}
                    />
                  </div>
                  <div>
                    <p className={cls("text-[13px] font-semibold leading-tight", dk ? "text-white" : "text-slate-900")}>
                      Edu51Portal Assistant
                    </p>
                    <p className={cls("text-[10.5px]", dk ? "text-slate-500" : "text-slate-400")}>
                      Platform help & study questions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className={cls(
                    "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                    dk ? "text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]" : "text-slate-400 hover:text-slate-700 hover:bg-violet-50",
                  )}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 min-h-0">
                {messages.length === 1 && messages[0] === WELCOME && (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <p className={cls("text-[12px] font-medium mb-1", dk ? "text-slate-300" : "text-slate-700")}>
                      Ask me anything
                    </p>
                    <p className={cls("text-[11px] max-w-[180px] leading-relaxed", dk ? "text-slate-600" : "text-slate-400")}>
                      Platform navigation or coursework — I've got you.
                    </p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16 }}
                    className={cls("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cls(
                        "max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed whitespace-pre-wrap break-words",
                        m.role === "user"
                          ? "text-white rounded-br-sm"
                          : dk
                          ? "text-slate-200 rounded-bl-sm border border-white/[0.07]"
                          : "text-slate-800 rounded-bl-sm border border-slate-200/60",
                      )}
                      style={
                        m.role === "user"
                          ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
                          : dk
                          ? { background: "rgba(255,255,255,0.055)" }
                          : { background: "#f4f5f9" }
                      }
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <TypingIndicator />
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div
                className={cls(
                  "flex items-end gap-2 px-3 py-3 border-t flex-shrink-0",
                  dk ? "border-white/[0.07]" : "border-violet-100/60",
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question…"
                  rows={1}
                  style={{ maxHeight: 96 }}
                  className={cls(
                    "flex-1 resize-none px-3.5 py-2.5 rounded-xl text-[12.5px] border outline-none transition-colors",
                    dk
                      ? "bg-white/[0.055] border-white/[0.08] text-slate-100 placeholder-slate-600 focus:border-violet-500/40"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400/50",
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle Button ── */}
      <motion.div
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: "absolute",
          bottom: BTN_BOTTOM,
          right: BTN_RIGHT,
          width: BTN_SIZE,
          height: BTN_SIZE,
          pointerEvents: "auto",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            opacity: 0.38,
            filter: "blur(14px)",
            pointerEvents: "none",
          }}
        />
        <button
          onClick={() => setOpen((v) => !v)}
          title="Edu51Portal Assistant"
          className="relative w-full h-full rounded-full text-white border-2 border-white/20 flex items-center justify-center shadow-xl transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span key="msg"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}
              >
                <MessageCircle className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </>,
    getPortalRoot()
  );
}
