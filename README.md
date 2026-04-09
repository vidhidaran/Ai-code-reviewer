# Ai-code-reviewer

An intelligent, agentic full-stack code review platform powered by LangChain, MCP, and Groq. Features a high-fidelity React UI with real-time bug detection, security scanning, and AST-based code analysis.

## 🚀 Key Features
- **Real-time Bug Detection**: Identifies logical errors and bugs with line numbers.
- **Security Scanning**: Automatically scans for vulnerabilities.
- **AST-based Analysis**: Deeper code understanding via Abstract Syntax Trees.
- **Premium UI**: Modern glass-morphism dashboard with smooth animations.

## Live Demo
- Frontend:https://ai-code-reviewer-beta-three.vercel.app/


## Tech Stack
- **Frontend**: React, Vite, Monaco Editor, Tailwind, Framer Motion
- **Backend**: Node.js, Express
- **AI Agent**: LangChain ReAct agent, Groq (Llama 3 70B)
- **MCP Servers**: GitHub MCP, Custom Code Analysis MCP, Groq Review MCP
- **Database**: MongoDB (review history)
- **Deployment**: Vercel + Render

## Architecture
User → React Frontend → Express API → LangChain Agent → MCP Client
                                                              ↓
                                          ┌─────────────────────────────┐
                                          │ GitHub MCP · Code Analysis  │
                                          │ MCP · Groq Review MCP       │
                                          └─────────────────────────────┘
                                                              ↓
                                               Structured JSON Review
                                                              ↓
                                                         MongoDB

## Features
- Real-time bug detection with line numbers and severity tags
- Security vulnerability scanning
- Cyclomatic complexity analysis
- AST parsing for code structure insights
- Side-by-side diff viewer (original vs fixed)
- Persistent review history via MongoDB
- Shareable review links
- File upload with drag & drop
- Multi-language support (JS, TS, Python, Java)

## Local Setup
# Clone
git clone https://github.com/vidhidaran/Ai-code-reviewer
cd ai-code-reviewer

# Install all dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..
cd mcp-servers/code-analysis && npm install && cd ../..
cd mcp-servers/gemini-review && npm install && cd ../..

# Add environment variables
cp server/.env.example .env
# Fill in GROQ_API_KEY and MONGODB_URI

# Run backend
cd server && npm run dev

# Run frontend (new terminal)
cd client && npm run dev
