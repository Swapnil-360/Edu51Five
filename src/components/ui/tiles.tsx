import { motion } from "framer-motion";

interface TilesProps {
  isDarkMode: boolean;
}

const TILE = 40;
const COLS = 52; // 52 × 40 = 2080px — covers wide screens
const ROWS = 26; // 26 × 40 = 1040px — covers tall viewports

export function Tiles({ isDarkMode }: TilesProps) {
  const borderColor = isDarkMode
    ? "rgba(44,59,58,0.22)"
    : "rgba(78,125,122,0.1)";
  const hoverColor = isDarkMode
    ? "rgba(78,125,122,0.07)"
    : "rgba(78,125,122,0.04)";

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex w-full h-full">
        {Array.from({ length: COLS }).map((_, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: TILE,
              borderLeft: `1px solid ${borderColor}`,
            }}
          >
            {Array.from({ length: ROWS }).map((_, j) => (
              <motion.div
                key={j}
                style={{
                  width: TILE,
                  height: TILE,
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `1px solid ${borderColor}`,
                  pointerEvents: "auto",
                }}
                whileHover={{
                  backgroundColor: hoverColor,
                  transition: { duration: 0 },
                }}
                animate={{ transition: { duration: 2 } }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
