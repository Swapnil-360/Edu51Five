import { useState } from "react";
import { X, Plus } from "lucide-react";

interface SkillsEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  isDarkMode: boolean;
  badgeColor?: "blue" | "purple" | "emerald";
}

/** Reusable tag/badge editor — used for skills, interests, team required skills. */
export default function SkillsEditor({
  items,
  onChange,
  placeholder = "Add a skill…",
  isDarkMode,
  badgeColor = "blue",
}: SkillsEditorProps) {
  const [input, setInput] = useState("");

  const colors = {
    blue: isDarkMode
      ? "bg-blue-900/40 text-blue-300 border-blue-700/50"
      : "bg-blue-50 text-blue-700 border-blue-200",
    purple: isDarkMode
      ? "bg-purple-900/40 text-purple-300 border-purple-700/50"
      : "bg-purple-50 text-purple-700 border-purple-200",
    emerald: isDarkMode
      ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[badgeColor];

  const add = () => {
    const v = input.trim().toLowerCase();
    if (!v || items.includes(v)) {
      setInput("");
      return;
    }
    onChange([...items, v]);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              className="hover:opacity-70"
              aria-label={`Remove ${item}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm border outline-none transition-colors ${
            isDarkMode
              ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
          }`}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}

/** Read-only badge list for displaying skills/interests. */
export function BadgeList({
  items,
  isDarkMode,
  badgeColor = "blue",
  emptyText = "Nothing added yet",
}: {
  items: string[];
  isDarkMode: boolean;
  badgeColor?: "blue" | "purple" | "emerald";
  emptyText?: string;
}) {
  const colors = {
    blue: isDarkMode
      ? "bg-blue-900/40 text-blue-300 border-blue-700/50"
      : "bg-blue-50 text-blue-700 border-blue-200",
    purple: isDarkMode
      ? "bg-purple-900/40 text-purple-300 border-purple-700/50"
      : "bg-purple-50 text-purple-700 border-purple-200",
    emerald: isDarkMode
      ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[badgeColor];

  if (!items.length) {
    return (
      <p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{emptyText}</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${colors}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
