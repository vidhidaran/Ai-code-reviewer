import { motion, AnimatePresence } from "framer-motion";

const scoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

function timeAgo(date) {
  const diff = (Date.now() - date) / 1000;
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const sidebarVariants = {
  hidden:  { x: -220, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit:    { x: -220, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function Sidebar({ history, onSelect }) {
  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Section label */}
      <div style={{
        padding: "14px 14px 8px",
        fontSize: 10, fontWeight: 600,
        color: "var(--text-tertiary)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        Review History
      </div>

      <div className="scroll-panel" style={{ flex: 1, overflowY: "auto" }}>
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "20px 14px", fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}
            >
              No reviews yet. Write or paste code and click Review Code.
            </motion.div>
          ) : (
            <motion.div key="list" variants={listVariants} initial="hidden" animate="visible">
              {history.map((item, idx) => (
                <SidebarItem key={item.id} item={item} onSelect={onSelect} isLatest={idx === 0} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function SidebarItem({ item, onSelect, isLatest }) {
  const color = scoreColor(item.score);

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ backgroundColor: "var(--bg-card-hover)" }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
      style={{
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
        transition: "background-color 0.15s",
      }}
    >
      {/* Left violet accent bar (shows on hover via CSS group) */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 2.5,
          background: "var(--violet)", transformOrigin: "bottom",
          borderRadius: "0 2px 2px 0",
        }}
      />

      {/* Filename row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <span style={{
          flex: 1, fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "var(--font-mono)",
        }}>
          {item.filename}
        </span>
        {isLatest && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 9, padding: "1px 5px", borderRadius: 99,
              background: "var(--violet-glow)", color: "var(--violet-light)",
              border: "1px solid var(--border-accent)", fontWeight: 600, flexShrink: 0,
            }}
          >
            NEW
          </motion.span>
        )}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Language pill */}
        <span style={{
          fontSize: 10, padding: "1px 7px", borderRadius: 99,
          background: "var(--bg-elevated)", color: "var(--text-tertiary)",
          border: "1px solid var(--border-subtle)",
        }}>
          {item.language}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Time ago */}
          <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
            {item.time ? timeAgo(item.time) : ""}
          </span>

          {/* Score badge */}
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            style={{
              fontSize: 11, fontWeight: 700, color,
              padding: "1px 7px", borderRadius: 6,
              background: `${color}18`, border: `1px solid ${color}44`,
            }}
          >
            {item.score}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
