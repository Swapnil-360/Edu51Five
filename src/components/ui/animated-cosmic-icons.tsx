import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface CosmicIconProps {
  size?: number;
  className?: string;
  strokeColor?: string;
}

/* ─── ASTRONAUT ─── floating with gentle tumble */
export function AstronautIcon({ size = 48, className, strokeColor = "#94A3B8" }: CosmicIconProps) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("", className)}
      style={{ width: size, height: size }}
      animate={{ y: [0, -3, 0, 3, 0], rotate: [0, 3, 0, -3, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* helmet */}
      <circle cx="24" cy="16" r="8" fill="#E2E8F0" opacity={0.1} />
      <circle cx="24" cy="16" r="8" stroke={strokeColor} strokeWidth={1.5} />
      <rect x="19" y="12" width="10" height="7" rx="3" fill="#38BDF8" opacity={0.2} />
      <rect x="19" y="12" width="10" height="7" rx="3" stroke="#38BDF8" strokeWidth={1} opacity={0.6} />
      {/* body */}
      <rect x="18" y="24" width="12" height="10" rx="3" fill="#E2E8F0" opacity={0.08} />
      <rect x="18" y="24" width="12" height="10" rx="3" stroke={strokeColor} strokeWidth={1.5} />
      {/* arms — rotate transform avoids d-morphing errors with AnimatePresence */}
      <motion.g
        style={{ transformOrigin: "18px 28px" }}
        animate={{ rotate: [0, 18, 0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M18 28c-4-1-6 2-8 4" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "30px 28px" }}
        animate={{ rotate: [0, -18, 0, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <path d="M30 28c4-1 6 2 8 4" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      </motion.g>
      {/* tether */}
      <motion.line
        x1="24" y1="34" x2="24" y2="44"
        stroke={strokeColor}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeDasharray="2 2"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.svg>
  );
}
