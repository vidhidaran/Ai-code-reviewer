import { DynamicTool } from "@langchain/core/tools";
import { mcpManager } from "../mcpClient/index.js";

// Tool 1 — Lint code via Code Analysis MCP
export const lintCodeTool = new DynamicTool({
    name: "lint_code",
    description: `Lints JavaScript or TypeScript code using ESLint rules.
    Returns an array of errors and warnings with line numbers and severity.
    Use this FIRST before any other tool.
    Input: JSON string with { code, language }`,
    func: async (input) => {
        try {
            const { code, language } = JSON.parse(input);
            const result = await mcpManager.callTool("lint_code", { code, language });
            return JSON.stringify(result);
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    }
});

// Tool 2 — Parse AST via Code Analysis MCP
export const parseASTTool = new DynamicTool({
    name: "parse_ast",
    description: `Parses code into an AST and extracts all functions, imports,
    and variables with their line numbers.
    Use this to understand code structure.
    Input: JSON string with { code }`,
    func: async (input) => {
        try {
            const { code } = JSON.parse(input);
            const result = await mcpManager.callTool("parse_ast", { code });
            return JSON.stringify(result);
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    }
});

// Tool 3 — Detect complexity via Code Analysis MCP
export const detectComplexityTool = new DynamicTool({
    name: "detect_complexity",
    description: `Calculates cyclomatic complexity, function count, and line metrics.
    Use this to assess how complex or maintainable the code is.
    Input: JSON string with { code }`,
    func: async (input) => {
        try {
            const { code } = JSON.parse(input);
            const result = await mcpManager.callTool("detect_complexity", { code });
            return JSON.stringify(result);
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    }
});

// Tool 4 — AI review via Gemini MCP
export const reviewCodeTool = new DynamicTool({
    name: "review_code",
    description: `Uses Google Gemini AI to perform a deep code review.
    Returns score (0-100), bugs array, security issues array,
    quality assessment string, and fixed code.
    Use this LAST after lint and complexity results are available.
    Input: JSON string with { code, language, lintResults, complexity }`,
    func: async (input) => {
        try {
            const { code, language, lintResults, complexity } = JSON.parse(input);
            const result = await mcpManager.callTool("review_code", {
                code,
                language,
                lintResults: lintResults ? JSON.stringify(lintResults) : undefined,
                complexity: complexity ? JSON.stringify(complexity) : undefined
            });
            return JSON.stringify(result);
        } catch (err) {
            return JSON.stringify({ error: err.message });
        }
    }
});

export const allTools = [
    lintCodeTool,
    parseASTTool,
    detectComplexityTool,
    reviewCodeTool
];
