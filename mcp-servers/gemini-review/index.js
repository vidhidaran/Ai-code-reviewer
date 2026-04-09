import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Groq from "groq-sdk";

const server = new Server(
    { name: "groq-review-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// ── Tool: review_code ──────────────────────────────────────
async function reviewCode(code, language, lintResults, complexity) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { error: "GROQ_API_KEY not set" };

    const groq = new Groq({ apiKey });

    const prompt = `
You are a senior software engineer doing a code review.
Analyze the following ${language} code and return ONLY a valid JSON object.

Code:
\`\`\`${language}
${code}
\`\`\`

${lintResults ? `ESLint found these issues: ${JSON.stringify(lintResults)}` : ""}
${complexity ? `Complexity metrics: ${JSON.stringify(complexity)}` : ""}

Return ONLY this JSON structure with no extra text:
{
  "score": <number 0-100>,
  "bugs": [{ "line": <number>, "severity": "critical|warning", "message": "<description>", "fix": "<suggestion>" }],
  "security": [{ "line": <number>, "severity": "critical|warning", "message": "<description>", "fix": "<suggestion>" }],
  "quality": "<2-3 sentence overall assessment>",
  "fixed": "<the corrected version of the code>"
}
`;

    try {
        const result = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Fast/Smart Groq model
            temperature: 0.1,
            max_tokens: 2048,
        });

        const text = result.choices[0]?.message?.content || "";

        // Strip markdown code fences if present
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        return parsed;
    } catch (err) {
        return {
            score: 50,
            bugs: [],
            security: [],
            quality: `Review completed with parsing issues: ${err.message}`,
            fixed: code
        };
    }
}

// ── Register tools ─────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "review_code",
            description: "Uses Groq AI to perform a deep code review. Returns score, bugs, security issues, quality assessment, and fixed code.",
            inputSchema: {
                type: "object",
                properties: {
                    code: { type: "string", description: "Source code to review" },
                    language: { type: "string", description: "Programming language" },
                    lintResults: { type: "string", description: "JSON string of ESLint results to include as context" },
                    complexity: { type: "string", description: "JSON string of complexity metrics to include as context" }
                },
                required: ["code", "language"]
            }
        }
    ]
}));

// ── Handle tool calls ──────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "review_code") {
        const result = await reviewCode(
            args.code,
            args.language || "javascript",
            args.lintResults ? JSON.parse(args.lintResults) : null,
            args.complexity ? JSON.parse(args.complexity) : null
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
});

// ── Start ──────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Groq Review MCP server running");
