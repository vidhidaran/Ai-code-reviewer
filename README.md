# AI Code Reviewer

An intelligent code review agent built with LangChain, MCP, and Groq (Llama 3).
Detects bugs, security issues, and code quality problems in real time.

## Live Demo
- Frontend: https://your-vercel-app.vercel.app
- Backend: https://your-render-app.onrender.com/health

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
git clone https://github.com/yourusername/ai-code-reviewer
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
