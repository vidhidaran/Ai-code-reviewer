import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_STYLES = {
  critical: { border: "var(--red)",   bg: "var(--red-bg)",   borderColor: "var(--red-border)",   label: "Critical", barBg: "#ef4444" },
  warning:  { border: "var(--amber)", bg: "var(--amber-bg)", borderColor: "var(--amber-border)", label: "Warning",  barBg: "#f59e0b" },
  info:     { border: "var(--teal)",  bg: "var(--teal-bg)",  borderColor: "var(--teal-border)",  label: "Info",     barBg: "#14b8a6" },
};

const cardVariant = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

export default function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);
  const style = TYPE_STYLES[issue.severity] ?? TYPE_STYLES.info;

  const copyFix = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.fix || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ borderColor: style.borderColor }}
      layout
      style={{
        marginBottom: 8, borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden", cursor: "pointer",
        background: "var(--bg-card)",
        transition: "border-color 0.2s",
        position: "relative",
      }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: style.border, borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px 10px 16px" }}>
        {/* Severity badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, flexShrink: 0, marginTop: 1,
          background: style.bg, color: style.border, border: `1px solid ${style.borderColor}`,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          {style.label}
        </span>

        {/* Line number */}
        {issue.line != null && (
          <span style={{
            fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)",
            flexShrink: 0, marginTop: 2, background: "var(--bg-elevated)",
            padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border-subtle)",
          }}>
            L{issue.line}
          </span>
        )}

        {/* Message */}
        <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
          {issue.message}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 3 }}
        >
          ▼
        </motion.span>
      </div>

      {/* Expanded fix block */}
      <AnimatePresence>
        {expanded && issue.fix && (
          <motion.div
            key="fix"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, opacity: { duration: 0.15 } }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: `1px solid var(--border-subtle)`,
              padding: "10px 12px 12px 16px",
            }}>
              {/* Fix label + copy button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal)", letterSpacing: "0.03em" }}>
                  💡 Suggested Fix
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={copyFix}
                  style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 5,
                    background: copied ? "var(--teal-bg)" : "var(--bg-elevated)",
                    border: copied ? "1px solid var(--teal-border)" : "1px solid var(--border-muted)",
                    color: copied ? "var(--teal)" : "var(--text-secondary)",
                    transition: "all 0.2s", cursor: "pointer",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </motion.button>
              </div>
              <div className="code-block">{issue.fix}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
