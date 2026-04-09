import { ChatGroq } from "@langchain/groq";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import { allTools } from "./tools.js";

// ── System prompt ──────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert senior software engineer performing a thorough code review.

You have access to the following tools:
{tools}

You MUST follow this exact order when reviewing code:
1. ALWAYS call lint_code first to get ESLint errors and warnings
2. ALWAYS call detect_complexity to get complexity metrics
3. ALWAYS call parse_ast to understand code structure
4. ALWAYS call review_code LAST, passing lint and complexity results as context

After all tools have run, compile the FINAL answer as a single valid JSON object:
{{
  "filename": "<filename>",
  "language": "<language>",
  "score": <0-100>,
  "bugs": [{{"line": <n>, "severity": "critical|warning", "message": "<msg>", "fix": "<fix>"}}],
  "security": [{{"line": <n>, "severity": "critical|warning", "message": "<msg>", "fix": "<fix>"}}],
  "quality": "<2-3 sentence assessment>",
  "complexity": {{"cyclomaticComplexity": <n>, "rating": "<low|medium|high>", "totalLines": <n>}},
  "original": "<original code>",
  "fixed": "<corrected code>"
}}

Use this format STRICTLY:
Question: the input question you must answer
Thought: think about what to do next
Action: the action to take, must be one of [{tool_names}]
Action Input: the input to the action as a JSON string
Observation: the result of the action
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I now have all the information needed
Final Answer: <the complete JSON object above>

Begin!

Question: {input}
Thought: {agent_scratchpad}`;

// ── Build agent ────────────────────────────────────────────
async function buildAgent() {
    const llm = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        apiKey: process.env.GROQ_API_KEY,
        temperature: 0.1,
        maxRetries: 2,
    });

    const prompt = PromptTemplate.fromTemplate(SYSTEM_PROMPT);

    const agent = await createReactAgent({
        llm,
        tools: allTools,
        prompt,
    });

    const executor = new AgentExecutor({
        agent,
        tools: allTools,
        verbose: true,          // shows ReAct loop in terminal — great for debugging
        maxIterations: 8,       // prevents infinite loops
        returnIntermediateSteps: true,
        handleParsingErrors: (err) => {
            console.error("Agent parsing error:", err);
            return "Parsing error occurred. Please reformat your response.";
        }
    });

    return executor;
}

// ── Run review ─────────────────────────────────────────────
export async function runCodeReview(code, filename, language) {
    try {
        const executor = await buildAgent();

        const input = `Review this ${language} code from file "${filename}":

\`\`\`${language}
${code}
\`\`\`

Run all analysis tools in order and return the complete structured JSON review.`;

        const result = await executor.invoke({ input });

        // Extract final answer from agent output
        let review = result.output;

        // Strip markdown fences if Gemini wrapped output
        if (typeof review === "string") {
            review = review.replace(/```json|```/g, "").trim();
            try {
                review = JSON.parse(review);
            } catch {
                // If JSON parse fails, return structured fallback
                return {
                    filename,
                    language,
                    score: 50,
                    bugs: [],
                    security: [],
                    quality: review,
                    complexity: {},
                    original: code,
                    fixed: code
                };
            }
        }

        // Ensure original code is always present
        return { ...review, original: code, filename, language };

    } catch (err) {
        console.error("Agent run failed:", err);
        throw new Error(`Agent failed: ${err.message}`);
    }
}
