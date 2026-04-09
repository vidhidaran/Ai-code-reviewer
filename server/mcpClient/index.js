import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tool → server mapping
const toolRegistry = {
    lint_code: "code-analysis",
    parse_ast: "code-analysis",
    detect_complexity: "code-analysis",
    review_code: "groq",
};

class MCPClientManager {
    constructor() {
        this.clients = {};
    }

    async connect(name, command, args, env = {}) {
        try {
            const transport = new StdioClientTransport({
                command,
                args,
                env: { ...process.env, ...env }
            });
            const client = new Client({ name: `client-${name}`, version: "1.0.0" }, { capabilities: {} });
            await client.connect(transport);
            this.clients[name] = client;
            console.log(`✅ Connected to MCP server: ${name}`);
        } catch (err) {
            console.error(`❌ Failed to connect to MCP server: ${name}`, err.message);
        }
    }

    async connectAll() {
        const codeAnalysisPath = path.resolve(__dirname, "../../mcp-servers/code-analysis/index.js");
        const geminiPath = path.resolve(__dirname, "../../mcp-servers/gemini-review/index.js");

        await this.connect("code-analysis", "node", [codeAnalysisPath]);
        await this.connect("groq", "node", [geminiPath], {
            GROQ_API_KEY: process.env.GROQ_API_KEY
        });
    }

    async callTool(toolName, args) {
        const serverName = toolRegistry[toolName];
        if (!serverName) throw new Error(`Unknown tool: ${toolName}`);

        const client = this.clients[serverName];
        if (!client) throw new Error(`Server not connected: ${serverName}`);

        try {
            const result = await client.callTool({ name: toolName, arguments: args });
            const text = result.content?.[0]?.text ?? "{}";
            return JSON.parse(text);
        } catch (err) {
            console.error(`Tool call failed [${toolName}]:`, err.message);
            return { error: err.message };
        }
    }

    async disconnectAll() {
        for (const [name, client] of Object.entries(this.clients)) {
            try {
                await client.close();
                console.log(`Disconnected: ${name}`);
            } catch (_) { }
        }
    }
}

export const mcpManager = new MCPClientManager();
