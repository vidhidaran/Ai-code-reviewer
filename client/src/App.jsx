import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "./components/Editor";
import ReviewPanel from "./components/ReviewPanel";
import Sidebar from "./components/Sidebar";
import "./styles.css";
import "./index.css";

const LANGUAGES = [
  { value: "javascript", label: "JS",  icon: "⬡" },
  { value: "typescript", label: "TS",  icon: "⬡" },
  { value: "python",     label: "PY",  icon: "🐍" },
  { value: "java",       label: "Java",icon: "☕" },
];

const pageVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const panelVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function App() {
  const [code, setCode]         = useState("// Paste your code here or upload a file\n");
  const [filename, setFilename] = useState("untitled.js");
  const [language, setLanguage] = useState("javascript");
  const [review, setReview]     = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStep, setLoadStep]   = useState(0);
  const [error, setError]         = useState(null);
  const [history, setHistory]     = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [btnState, setBtnState]   = useState("idle"); // idle | loading | done
  const fileRef = useRef();

  const STEPS = [
    "Linting code with ESLint",
    "Parsing abstract syntax tree",
    "Detecting complexity metrics",
    "Running Gemini AI deep review",
  ];

  const handleReview = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setReview(null);
    setBtnState("loading");
    setLoadStep(0);
    setReviewPanelOpen(true);

    // Animate steps
    const intervals = STEPS.map((_, i) =>
      setTimeout(() => setLoadStep(i + 1), i * 1800)
    );

    try {
      const res  = await fetch("http://localhost:5000/api/review", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, filename, language }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setReview(data.review);
      setBtnState("done");
      setHistory(prev => [
        { id: Date.now(), filename, language, score: data.review.score, review: data.review, time: new Date() },
        ...prev.slice(0, 9),
      ]);
      setTimeout(() => setBtnState("idle"), 2500);
    } catch (err) {
      setError(err.message);
      setBtnState("idle");
    } finally {
      intervals.forEach(clearTimeout);
      setIsLoading(false);
    }
  };

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = [".js",".jsx",".ts",".tsx",".py",".java",".c",".cpp"];
    const ext = "." + file.name.split(".").pop();
    if (!allowed.includes(ext)) return alert("Unsupported file type");
    if (file.size > 2 * 1024 * 1024) return alert("File too large (max 2MB)");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target.result);
      setFilename(file.name);
      const langMap = { js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",py:"python",java:"java" };
      setLanguage(langMap[file.name.split(".").pop()] || "javascript");
    };
    reader.readAsText(file);
  };

  const lineCount = code.split("\n").length;
  const currentLang = LANGUAGES.find(l => l.value === language);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}
    >
      {/* ── Navbar ── */}
      <motion.nav variants={panelVariants} className="glass" style={{
        height: "var(--navbar-height)",
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative", zIndex: 50, flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(v => !v)}
          style={{ width: 30, height: 30, borderRadius: 6, background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", flexShrink: 0 }}
        >
          ☰
        </motion.button>

        {/* Logo */}
        <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", flexShrink: 0 }}>
          AI Code Reviewer
        </span>

        <div style={{ width: 1, height: 20, background: "var(--border-subtle)", margin: "0 4px" }} />

        {/* Filename */}
        <input
          value={filename}
          onChange={e => setFilename(e.target.value)}
          style={{
            padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)",
            fontSize: 12, background: "var(--bg-input)", color: "var(--text-primary)",
            width: 150, transition: "border-color 0.2s",
            fontFamily: "var(--font-mono)",
          }}
          onFocus={e => e.target.style.borderColor = "var(--border-accent)"}
          onBlur={e  => e.target.style.borderColor = "var(--border-subtle)"}
        />

        {/* Language pills */}
        <div style={{ display: "flex", gap: 4 }}>
          {LANGUAGES.map(l => (
            <motion.button
              key={l.value}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setLanguage(l.value)}
              style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                border: language === l.value ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                background: language === l.value ? "rgba(99,102,241,0.15)" : "var(--bg-card)",
                color: language === l.value ? "var(--violet-light)" : "var(--text-secondary)",
                transition: "all 0.2s",
                boxShadow: language === l.value ? "0 0 8px rgba(99,102,241,0.2)" : "none",
              }}
            >
              {l.label}
            </motion.button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* File upload icon button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileRef.current.click()}
          data-tooltip="Upload file"
          style={{
            width: 32, height: 32, borderRadius: 7,
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, transition: "all 0.2s",
          }}
        >
          ↑
        </motion.button>
        <input ref={fileRef} type="file" accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp"
          style={{ display: "none" }} onChange={handleFileLoad} />

        {/* Review button */}
        <ReviewButton state={btnState} onClick={handleReview} disabled={isLoading} />
      </motion.nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <Sidebar
              history={history}
              onSelect={(item) => { setReview(item.review); setFilename(item.filename); setReviewPanelOpen(true); }}
            />
          )}
        </AnimatePresence>

        {/* Editor pane */}
        <motion.div variants={panelVariants} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Editor header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 14px",
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              {currentLang?.icon}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flex: 1 }}>
              {filename}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              {lineCount} lines
            </span>
          </div>
          {/* Violet top accent line */}
          <div style={{ height: 2, background: "linear-gradient(90deg, var(--violet), var(--cyan))", flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor code={code} language={language} onChange={setCode} />
          </div>
        </motion.div>

        {/* Review panel */}
        <AnimatePresence>
          {reviewPanelOpen && (
            <motion.div
              key="review-panel"
              initial={{ x: 480, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={{
                width: 480, flexShrink: 0,
                display: "flex", flexDirection: "column",
                background: "var(--bg-panel)",
                borderLeft: "1px solid var(--border-subtle)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setReviewPanelOpen(false)}
                style={{
                  position: "absolute", top: 10, right: 12, zIndex: 10,
                  width: 22, height: 22, borderRadius: 5,
                  background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)", fontSize: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</motion.button>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="error"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ margin: 16, padding: 12, borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "#fca5a5", fontSize: 13 }}>
                    ⚠ {error}
                  </motion.div>
                )}
                {isLoading && !review && <LoadingPanel steps={STEPS} currentStep={loadStep} />}
                {review && !isLoading && (
                  <motion.div key="review-content" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ReviewPanel review={review} />
                  </motion.div>
                )}
                {!review && !isLoading && !error && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13, gap: 8, padding: 32 }}>
                    <span style={{ fontSize: 32 }}>⬡</span>
                    <div>Click <strong style={{ color: "var(--text-secondary)" }}>Review Code</strong> to begin</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Review Button ── */
function ReviewButton({ state, onClick, disabled }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03, boxShadow: "0 0 28px rgba(99,102,241,0.45), 0 2px 8px rgba(99,102,241,0.3)" } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      animate={state === "done" ? { boxShadow: "0 0 0 0 rgba(99,102,241,0)" } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: state === "done"
          ? "linear-gradient(135deg, #10b981, #059669)"
          : "linear-gradient(135deg, var(--violet), var(--violet-dark))",
        color: "#fff",
        boxShadow: "var(--shadow-btn)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 7,
        transition: "background 0.3s",
        position: "relative", overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Shimmer overlay */}
      {!disabled && (
        <motion.span
          initial={{ x: "-100%", opacity: 0.3 }}
          whileHover={{ x: "200%" }}
          transition={{ duration: 0.6 }}
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            pointerEvents: "none",
          }}
        />
      )}
      {state === "loading" && <Spinner />}
      {state === "done"    && <span>✓</span>}
      {state === "loading" ? "Analyzing…" : state === "done" ? "Done!" : "Review Code"}
    </motion.button>
  );
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", flexShrink: 0 }}
    />
  );
}

/* ── Loading Panel ── */
function LoadingPanel({ steps, currentStep }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 10 }}
    >
      {/* Skeleton rows */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 10, width: "40%", borderRadius: 6 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: "100%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 10, width: "85%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 10, width: "70%", borderRadius: 6 }} />

      {/* Step tracker */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => {
          const done    = i < currentStep;
          const active  = i === currentStep - 1;
          const pending = i >= currentStep;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < steps.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
            >
              {/* Icon */}
              <motion.div
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: done ? "var(--green-bg)" : active ? "var(--violet-glow)" : "var(--bg-card)",
                  border: done ? "1px solid var(--teal-border)" : active ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                  color: done ? "var(--green)" : active ? "var(--violet-light)" : "var(--text-tertiary)",
                }}
              >
                {done ? "✓" : i + 1}
              </motion.div>
              <span style={{ fontSize: 12.5, color: done ? "var(--text-secondary)" : active ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: active ? 500 : 400 }}>
                {step}
                {active && <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 1 }}>…</motion.span>}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
