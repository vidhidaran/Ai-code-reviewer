import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IssueCard from "./IssueCard";
import DiffViewer from "./DiffViewer";
import ReactMarkdown from "react-markdown";

const TABS = [
  { id: "bugs",     label: "Bugs"     },
  { id: "security", label: "Security" },
  { id: "quality",  label: "Quality"  },
  { id: "diff",     label: "Diff"     },
];

const scoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
const scoreGlow  = (s) => s >= 80 ? "rgba(16,185,129,0.3)" : s >= 60 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";

/* ─── Animated Score Ring ────────────────────────────────── */
function ScoreRing({ score }) {
  const R = 36;
  const circumference = 2 * Math.PI * R;
  const color = scoreColor(score);
  const glow  = scoreGlow(score);

  return (
    <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Progress */}
        <motion.circle
          cx="44" cy="44" r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
      {/* Score label */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 22 }}
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>SCORE</span>
      </motion.div>
    </div>
  );
}

/* ─── Tab bar with sliding underline ────────────────────── */
function TabBar({ tabs, active, setActive, review }) {
  const tabRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[active];
    if (el) setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <div style={{ display: "flex", position: "relative", padding: "0 16px", borderBottom: "1px solid var(--border-subtle)", gap: 0 }}>
      {tabs.map(tab => {
        const count = tab.id === "bugs" ? review.bugs?.length : tab.id === "security" ? review.security?.length : null;
        return (
          <button
            key={tab.id}
            ref={el => tabRefs.current[tab.id] = el}
            onClick={() => setActive(tab.id)}
            style={{
              padding: "10px 14px", fontSize: 12.5, fontWeight: active === tab.id ? 600 : 400,
              background: "transparent", border: "none", cursor: "pointer",
              color: active === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
              display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s",
            }}
          >
            {tab.label}
            {count != null && (
              <motion.span
                animate={count > 0 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 99,
                  background: count > 0
                    ? (tab.id === "bugs" ? "var(--red-bg)" : "var(--amber-bg)")
                    : "var(--bg-elevated)",
                  color: count > 0
                    ? (tab.id === "bugs" ? "var(--red)" : "var(--amber)")
                    : "var(--text-tertiary)",
                  border: count > 0
                    ? (tab.id === "bugs" ? "1px solid var(--red-border)" : "1px solid var(--amber-border)")
                    : "1px solid var(--border-subtle)",
                }}
              >
                {count}
              </motion.span>
            )}
          </button>
        );
      })}
      {/* Sliding underline */}
      <motion.div
        animate={{ left: underline.left, width: underline.width }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        style={{
          position: "absolute", bottom: 0, height: 2,
          background: "var(--violet)", borderRadius: "2px 2px 0 0",
        }}
      />
    </div>
  );
}

/* ─── Metric card ────────────────────────────────────────── */
function MetricCard({ label, value, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: "var(--border-accent)", background: "var(--bg-card-hover)" }}
      style={{
        padding: "12px 14px", borderRadius: "var(--radius-md)",
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: 16, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </motion.div>
  );
}

/* ─── Tab content ────────────────────────────────────────── */
const tabContentVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── Main Component ─────────────────────────────────────── */
export default function ReviewPanel({ review }) {
  const [activeTab, setActiveTab] = useState("bugs");
  const [copied, setCopied]       = useState(false);

  const handleShare = () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(review))));
    navigator.clipboard.writeText(`${window.location.href}?review=${data}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Score ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <ScoreRing score={review.score || 0} />
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {review.filename}
              </span>
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 99, fontWeight: 500,
                background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-muted)",
              }}>
                {review.language}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {(review.bugs?.length || 0)} bugs · {(review.security?.length || 0)} security issues
            </div>
          </div>

          {/* Share */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleShare}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 500,
              background: copied ? "var(--teal-bg)" : "var(--bg-elevated)",
              border: copied ? "1px solid var(--teal-border)" : "1px solid var(--border-muted)",
              color: copied ? "var(--teal)" : "var(--text-secondary)", transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Share"}
          </motion.button>
        </div>
      </div>

      {/* Score progress bar */}
      <div style={{ height: 2, background: "var(--border-subtle)", flexShrink: 0 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${review.score}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${scoreColor(review.score)}, ${scoreColor(review.score)}aa)` }}
        />
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} active={activeTab} setActive={setActiveTab} review={review} />

      {/* Tab content */}
      <div className="scroll-panel" style={{ flex: 1, padding: 14, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          {activeTab === "bugs" && (
            <motion.div key="bugs" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <motion.div variants={listVariants} initial="hidden" animate="visible">
                {review.bugs?.length > 0
                  ? review.bugs.map((bug, i) => <IssueCard key={i} issue={bug} type="bug" />)
                  : <EmptyState icon="🐛" message="No bugs detected" sub="Code looks clean!" />
                }
              </motion.div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div key="security" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <motion.div variants={listVariants} initial="hidden" animate="visible">
                {review.security?.length > 0
                  ? review.security.map((s, i) => <IssueCard key={i} issue={s} type="security" />)
                  : <EmptyState icon="🔒" message="No security issues" sub="Your code is secure" />
                }
              </motion.div>
            </motion.div>
          )}

          {activeTab === "quality" && (
            <motion.div key="quality" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              {review.complexity && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <MetricCard icon="🔁" label="Complexity" value={review.complexity.cyclomaticComplexity} />
                  <MetricCard icon="📊" label="Rating"     value={review.complexity.rating} />
                  <MetricCard icon="📏" label="Lines"      value={review.complexity.totalLines} />
                  <MetricCard icon="⚙️"  label="Functions"  value={review.complexity.functionCount} />
                </div>
              )}
              <div style={{
                fontSize: 13.5, lineHeight: 1.75, color: "var(--text-secondary)",
                padding: "12px 14px", borderRadius: "var(--radius-md)",
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              }}>
                <ReactMarkdown>{review.quality || "No quality assessment available."}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {activeTab === "diff" && (
            <motion.div key="diff" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <DiffViewer original={review.original} fixed={review.fixed} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ icon, message, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{message}</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{sub}</div>
    </motion.div>
  );
}
