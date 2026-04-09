import ReactDiffViewer from "react-diff-viewer-continued";

export default function DiffViewer({ original, fixed }) {
  if (!original && !fixed) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
        No diff available
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", fontSize: 12, border: "1px solid var(--border-subtle)" }}>
      <ReactDiffViewer
        oldValue={original || ""}
        newValue={fixed || ""}
        splitView={true}
        leftTitle="Original"
        rightTitle="Fixed"
        useDarkTheme={true}
        styles={{
          variables: {
            dark: {
              diffViewerBackground:   "#0e0e16",
              addedBackground:        "#0d2117",
              removedBackground:      "#210d0d",
              wordAddedBackground:    "#1a4430",
              wordRemovedBackground:  "#4a1414",
              addedGutterBackground:  "#0d2117",
              removedGutterBackground:"#210d0d",
              gutterBackground:       "#111118",
              gutterColor:            "#4a4a5a",
              codeFoldBackground:     "#16161f",
              emptyLineBackground:    "#0e0e16",
              codeFoldContentColor:   "#4a4a5a",
              diffViewerTitleBackground: "#16161f",
              diffViewerTitleColor:   "#8b8b9a",
              diffViewerTitleBorderColor: "rgba(255,255,255,0.06)",
            }
          },
          line:    { fontFamily: "var(--font-mono)", fontSize: "12px" },
          content: { fontFamily: "var(--font-mono)" },
        }}
      />
    </div>
  );
}
