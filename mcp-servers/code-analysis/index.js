import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Linter } from "eslint";
import * as parser from "@babel/parser";

// ── Create MCP server ──────────────────────────────────────
const server = new Server(
    { name: "code-analysis-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// ── Tool 1: lint_code ──────────────────────────────────────
function lintCode(code, language = "javascript") {
    try {
        const linter = new Linter();
        const messages = linter.verify(code, {
            env: { es2021: true, browser: true, node: true },
            parserOptions: { ecmaVersion: 2021, sourceType: "module", ecmaFeatures: { jsx: true } },
            rules: {
                "no-undef": "error",
                "no-unused-vars": "warn",
                "no-console": "warn",
                "eqeqeq": "error",
                "no-var": "warn",
                "prefer-const": "warn",
                "no-unreachable": "error",
                "no-empty": "warn",
                "semi": ["warn", "always"],
            }
        });

        return messages.map(m => ({
            line: m.line,
            column: m.column,
            severity: m.severity === 2 ? "critical" : "warning",
            message: m.message,
            rule: m.ruleId
        }));
    } catch (err) {
        return [{ line: 0, severity: "critical", message: `Lint failed: ${err.message}`, rule: null }];
    }
}

// ── Tool 2: parse_ast ──────────────────────────────────────
function parseAST(code) {
    try {
        const ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
            errorRecovery: true
        });

        // Extract useful info from AST
        const functions = [];
        const imports = [];
        const variables = [];

        function walk(node) {
            if (!node || typeof node !== "object") return;

            if (node.type === "FunctionDeclaration" && node.id) {
                functions.push({
                    name: node.id.name,
                    line: node.loc?.start?.line,
                    params: node.params?.length || 0
                });
            }
            if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") {
                functions.push({
                    name: "anonymous",
                    line: node.loc?.start?.line,
                    params: node.params?.length || 0
                });
            }
            if (node.type === "ImportDeclaration") {
                imports.push({ source: node.source?.value, line: node.loc?.start?.line });
            }
            if (node.type === "VariableDeclaration") {
                node.declarations?.forEach(d => {
                    if (d.id?.name) variables.push({ name: d.id.name, kind: node.kind, line: d.loc?.start?.line });
                });
            }

            for (const key of Object.keys(node)) {
                if (key === "type" || key === "loc" || key === "start" || key === "end") continue;
                const child = node[key];
                if (Array.isArray(child)) child.forEach(walk);
                else if (child && typeof child === "object") walk(child);
            }
        }

        walk(ast.program);

        return { functions, imports, variables, totalNodes: functions.length + imports.length + variables.length };
    } catch (err) {
        return { error: `AST parsing failed: ${err.message}`, functions: [], imports: [], variables: [] };
    }
}

// ── Tool 3: detect_complexity ──────────────────────────────
function detectComplexity(code) {
    try {
        // Cyclomatic complexity: count decision points
        const decisionPoints = [
            /\bif\s*\(/g,
            /\belse\s+if\s*\(/g,
            /\bwhile\s*\(/g,
            /\bfor\s*\(/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\?\s*.+\s*:/g,   // ternary
            /&&/g,
            /\|\|/g,
        ];

        let complexity = 1; // base complexity
        decisionPoints.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) complexity += matches.length;
        });

        const lines = code.split("\n").length;
        const functions = (code.match(/function\s+\w+|=>\s*{|\bfunction\s*\(/g) || []).length;

        let rating = "low";
        if (complexity > 10) rating = "medium";
        if (complexity > 20) rating = "high";

        return {
            cyclomaticComplexity: complexity,
            rating,
            totalLines: lines,
            functionCount: functions,
            averageLinesPerFunction: functions > 0 ? Math.round(lines / functions) : lines
        };
    } catch (err) {
        return { error: `Complexity analysis failed: ${err.message}` };
    }
}

// ── Register tools list ────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "lint_code",
            description: "Lints JavaScript/TypeScript code using ESLint rules. Returns array of errors and warnings with line numbers and severity.",
            inputSchema: {
                type: "object",
                properties: {
                    code: { type: "string", description: "Source code to lint" },
                    language: { type: "string", description: "Programming language (javascript/typescript)" }
                },
                required: ["code"]
            }
        },
        {
            name: "parse_ast",
            description: "Parses code into AST and extracts functions, imports, and variables with their line numbers.",
            inputSchema: {
                type: "object",
                properties: {
                    code: { type: "string", description: "Source code to parse" }
                },
                required: ["code"]
            }
        },
        {
            name: "detect_complexity",
            description: "Calculates cyclomatic complexity, function count, and line metrics for submitted code.",
            inputSchema: {
                type: "object",
                properties: {
                    code: { type: "string", description: "Source code to analyze" }
                },
                required: ["code"]
            }
        }
    ]
}));

// ── Handle tool calls ──────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let result;

    switch (name) {
        case "lint_code":
            result = lintCode(args.code, args.language);
            break;
        case "parse_ast":
            result = parseAST(args.code);
            break;
        case "detect_complexity":
            result = detectComplexity(args.code);
            break;
        default:
            return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }

    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
});

// ── Start server ───────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Code Analysis MCP server running");
