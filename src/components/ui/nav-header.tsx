import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Users, UserPlus, GraduationCap, BookOpen } from "lucide-react";

interface NavTab {
  label: string;
  view: string;
  icon: React.ReactNode;
  badge?: { text: string; className: string };
  onClick: () => void;
  isActive: boolean;
}

interface SlideNavProps {
  tabs: NavTab[];
  isDarkMode: boolean;
}

function SlideNav({ tabs, isDarkMode }: SlideNavProps) {
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });

  return (
    <ul
      className={`relative flex items-center rounded-2xl p-1.5 gap-0.5 border transition-colors duration-300 ${
        isDarkMode
          ? "bg-slate-800/80 border-slate-700/60 shadow-lg shadow-black/20"
          : "bg-slate-100 border-slate-200/80 shadow-md shadow-black/5"
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
      className={`relative z-10 flex items-center gap-2 cursor-pointer select-none px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-150 whitespace-nowrap ${
        tab.isActive
          ? isDarkMode ? "text-white" : "text-slate-900"
          : isDarkMode
          ? "text-slate-400 hover:text-slate-200"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${tab.isActive ? (isDarkMode ? "text-blue-400" : "text-blue-600") : ""}`}>
        {tab.icon}
      </span>
      <span>{tab.label}</span>
      {tab.badge && (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-none ${tab.badge.className}`}>
          {tab.badge.text}
        </span>
      )}
      {/* Active background pill */}
      {tab.isActive && (
        <motion.span
          layoutId="active-nav-pill"
          className={`absolute inset-0 rounded-xl -z-10 ${
            isDarkMode
              ? "bg-gradient-to-r from-slate-700 to-slate-600 shadow-sm"
              : "bg-white shadow-sm border border-slate-200/60"
          }`}
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
    className={`absolute z-0 h-9 rounded-xl pointer-events-none ${
      isDarkMode ? "bg-slate-700/60" : "bg-white/70 shadow-sm"
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
      icon: <Trophy className="w-4 h-4" />,
      badge: { text: "LIVE", className: "bg-green-500 text-white animate-pulse" },
      isActive: currentView === "wc26",
      onClick: () => requireLogin("wc26", "the World Cup 2026 event"),
    },
    {
      label: "Semester",
      view: "semester",
      icon: <Clock className="w-4 h-4" />,
      isActive: currentView === "semester",
      onClick: () => requireLogin("semester", "Semester Tracker"),
    },
    {
      label: "Teams",
      view: "teams",
      icon: <Users className="w-4 h-4" />,
      badge: { text: "NEW", className: "bg-emerald-500 text-white" },
      isActive: currentView === "teams" || currentView === "team",
      onClick: () => requireLogin("teams", "Team Building"),
    },
    {
      label: "Network",
      view: "network",
      icon: <UserPlus className="w-4 h-4" />,
      badge: { text: "NEW", className: "bg-sky-500 text-white" },
      isActive: currentView === "network",
      onClick: () => requireLogin("network", "My Network"),
    },
    {
      label: "Alumni",
      view: "alumni",
      icon: <GraduationCap className="w-4 h-4" />,
      badge: {
        text: "SOON",
        className: isDarkMode ? "bg-slate-600 text-slate-300" : "bg-slate-200 text-slate-600",
      },
      isActive: currentView === "alumni",
      onClick: () => goToView("alumni"),
    },
    {
      label: "Routine",
      view: "custom",
      icon: <BookOpen className="w-4 h-4" />,
      isActive: currentView === "custom",
      onClick: () => requireLogin("custom", "Custom Routine"),
    },
  ];

  return <SlideNav tabs={tabs} isDarkMode={isDarkMode} />;
}
