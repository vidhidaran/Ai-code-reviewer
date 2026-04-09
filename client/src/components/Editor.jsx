import MonacoEditor from "@monaco-editor/react";

export default function Editor({ code, language, onChange }) {
    return (
        <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => onChange(val || "")}
            theme="vs-dark"
            options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "line",
                tabSize: 2,
                automaticLayout: true,
            }}
        />
    );
}
