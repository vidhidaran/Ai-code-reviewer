import { useRef } from "react";

export default function FileUpload({ onFileLoad }) {
    const inputRef = useRef();

    const handleFile = (file) => {
        if (!file) return;
        const allowed = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp"];
        const ext = "." + file.name.split(".").pop();
        if (!allowed.includes(ext)) return alert("Unsupported file type");
        if (file.size > 2 * 1024 * 1024) return alert("File too large (max 2MB)");

        const reader = new FileReader();
        reader.onload = (e) => onFileLoad(e.target.result, file.name);
        reader.readAsText(file);
    };

    return (
        <>
            <button
                onClick={() => inputRef.current.click()}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary)" }}
            >
                Upload file
            </button>
            <input ref={inputRef} type="file" accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp"
                style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        </>
    );
}
