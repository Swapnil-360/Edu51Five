import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

type BadgeType = "live" | "new" | "soon";

interface NavTab {
  label: string;
  view: string;
  badge?: BadgeType;
  onClick: () => void;
  isActive: boolean;
}

interface SlideNavProps {
  tabs: NavTab[];
  isDarkMode: boolean;
}

function LiveDot() {
  return (
    <span className="relative flex items-center justify-center w-4 h-4">
      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
    </span>
  );
}

function NewBadge({ isActive, isDarkMode }: { isActive: boolean; isDarkMode: boolean }) {
  return (
    <span
      className={`relative overflow-hidden px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none tracking-wide ${
        isActive
          ? "bg-white/20 text-white"
          : "bg-emerald-500 text-white"
      }`}
    >
      {/* shimmer sweep */}
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      NEW
    </span>
  );
}

function SoonBadge({ isActive, isDarkMode }: { isActive: boolean; isDarkMode: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold leading-none tracking-wide border ${
        isActive
          ? "border-white/30 text-white/70"
          : isDarkMode
          ? "border-slate-600 text-slate-400"
          : "border-slate-300 text-slate-400"
      }`}
    >
      SOON
    </span>
  );
}

function SlideNav({ tabs, isDarkMode }: SlideNavProps) {
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });

  return (
    <ul
      className={`relative flex items-center rounded-full px-2 py-2 gap-0.5 border transition-colors duration-300 ${
        isDarkMode
          ? "bg-slate-800 border-slate-700 shadow-lg shadow-black/30"
          : "bg-white border-slate-300 shadow-md shadow-black/8"
      }`}
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {tabs.map((tab) => (
        <NavTab
          key={tab.view}
          tab={tab}
          setPosition={setPosition}
          isDarkMode={isDarkMode}
        />
      ))}
      <Cursor position={position} isDarkMode={isDarkMode} />
    </ul>
  );
}

const NavTab = ({
  tab,
  setPosition,
  isDarkMode,
}: {
  tab: NavTab;
  setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>;
  isDarkMode: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onClick={tab.onClick}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
      className={`relative z-10 flex items-center gap-1.5 cursor-pointer select-none px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-150 whitespace-nowrap ${
        tab.isActive
          ? "text-white"
          : isDarkMode
          ? "text-slate-400 hover:text-slate-200"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {tab.badge === "live" && <LiveDot />}
      <span>{tab.label}</span>
      {tab.badge === "new" && <NewBadge isActive={tab.isActive} isDarkMode={isDarkMode} />}
      {tab.badge === "soon" && <SoonBadge isActive={tab.isActive} isDarkMode={isDarkMode} />}

      {/* Active filled pill */}
      {tab.isActive && (
        <motion.span
          layoutId="active-nav-pill"
          className={`absolute inset-0 rounded-full -z-10 ${
            isDarkMode
              ? "bg-slate-100"
              : "bg-slate-900"
          }`}
          style={tab.isActive && !isDarkMode ? { color: "white" } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </li>
  );
};

const Cursor = ({
  position,
  isDarkMode,
}: {
  position: { left: number; width: number; opacity: number };
  isDarkMode: boolean;
}) => (
  <motion.li
    animate={position}
    transition={{ type: "spring", stiffness: 350, damping: 30 }}
    className={`absolute z-0 h-9 rounded-full pointer-events-none ${
      isDarkMode ? "bg-slate-700/70" : "bg-slate-100"
    }`}
  />
);

// Wired-up version for App.tsx
interface AppNavHeaderProps {
  currentView: string;
  isDarkMode: boolean;
  isLoggedIn: boolean;
  goToView: (view: string) => void;
  showMajorAccessNotification: (type: string, msg: string) => void;
  setShowSignInModal: (v: boolean) => void;
}

export function AppNavHeader({
  currentView,
  isDarkMode,
  isLoggedIn,
  goToView,
  showMajorAccessNotification,
  setShowSignInModal,
}: AppNavHeaderProps) {
  const requireLogin = (view: string, label: string) => {
    if (!isLoggedIn) {
      showMajorAccessNotification("error", `Please sign in to access ${label}`);
      setShowSignInModal(true);
      return;
    }
    goToView(view);
  };

  const tabs: NavTab[] = [
    {
      label: "World Cup '26",
      view: "wc26",
      badge: "live",
      isActive: currentView === "wc26",
      onClick: () => requireLogin("wc26", "the World Cup 2026 event"),
    },
    {
      label: "Semester",
      view: "semester",
      isActive: currentView === "semester",
      onClick: () => requireLogin("semester", "Semester Tracker"),
    },
    {
      label: "Teams",
      view: "teams",
      badge: "new",
      isActive: currentView === "teams" || currentView === "team",
      onClick: () => requireLogin("teams", "Team Building"),
    },
    {
      label: "Network",
      view: "network",
      badge: "new",
      isActive: currentView === "network",
      onClick: () => requireLogin("network", "My Network"),
    },
    {
      label: "Alumni",
      view: "alumni",
      badge: "soon",
      isActive: currentView === "alumni",
      onClick: () => goToView("alumni"),
    },
    {
      label: "Routine",
      view: "custom",
      isActive: currentView === "custom",
      onClick: () => requireLogin("custom", "Custom Routine"),
    },
  ];

  return <SlideNav tabs={tabs} isDarkMode={isDarkMode} />;
}
