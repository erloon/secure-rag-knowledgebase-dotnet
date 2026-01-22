# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Secure RAG (Retrieval-Augmented Generation) Knowledge Base** built with .NET 10, designed to provide private AI-powered document Q&A. The system runs entirely in the client's cloud environment (Azure/AWS) ensuring zero data leakage.

**Key Business Value:**
- Privacy-first: No external data training
- Citations with source attribution for trust
- Cost-effective using openai/gpt-oss-120b
- 80% reduction in document search time

## Tech Stack

- **Backend:** .NET 10 (C#), ASP.NET Core minimal API
- **AI Orchestration:** Microsoft Agent Framework (https://github.com/microsoft/agent-framework)
- **LLM & Embeddings:** openrouter.ai (openai/gpt-oss-120b, openai/text-embedding-3-small)
- **Vector Database:** Qdrant (Docker container via Aspire)
- **Frontend:** Next.js, React with Shadcn UI components hosted on Aspire
- **Orchestration:** .NET Aspire 13.1 for distributed application management
- **Storage:** Local disk (VPS hosting)

## Project Conventions

- All .NET project names MUST use the `KbRag` prefix (e.g., `KbRag.Aspire.AppHost`, `KbRag.Api`)
- All class library projects follow the pattern `KbRag.<Layer>` (e.g., `KbRag.Core`, `KbRag.Infrastructure`)
- Test projects use the suffix `.Tests` (e.g., `KbRag.Core.Tests`, `KbRag.Api.Tests`)
- Solution file is named `KbRag.sln` at the root level
- Frontend projects use kebab-case without prefix (e.g., `kb-rag-frontend`)
- Docker containers and services use kebab-case naming (e.g., `qdrant-vector-store`, `aspire-dashboard`)

## Architecture Pattern

The application follows a RAG (Retrieval-Augmented Generation) flow:

### Phase 1: Document Ingestion
```
Upload (PDF/DOCX/TXT/MD) → Text Extraction → Chunking (1000 chars + 200 overlap)
→ Embedding Generation → Qdrant Vector Storage
```

### Phase 2: Query & Retrieval
```
User Query → Query Embedding → Qdrant Vector Search (Top 3 chunks)
→ Context-Aware LLM Prompt → Streaming Response with Citations
```

### Key Architectural Principles

1. **Citation-First Design:** Every answer MUST include source references (e.g., `[Source: Employee_Handbook.pdf, Page 12]`)
2. **"I Don't Know" Fallback:** System must refuse to answer when context is insufficient rather than hallucinate
3. **Streaming Responses:** Use Server-Sent Events (SSE) or SignalR for real-time token streaming
4. **Context Window:** Support 3-5 turns of conversation history

## Core Components

### Document Processing Pipeline
- **Text Extraction:** PDF (text-based only, no OCR for MVP), DOCX, TXT, Markdown
- **Chunking Strategy:** Paragraph-based with 200-character overlap to preserve context
- **Embedding:** openrouter.ai openai/text-embedding-3-small

### Vector Store (Qdrant)
- Runs in Docker container managed by Aspire
- Stores embeddings with metadata (filename, page number, chunk index)
- Semantic search for top-k relevant chunks (default: Top 3)

### Chat Interface
- Streaming responses to reduce perceived latency
- Source citations displayed with each answer
- Short conversation memory (3-5 turns)

## Development Commands

**Note:** This project is currently in planning/documentation phase. No source code exists yet.

### When Source Code is Implemented:

```bash
# Build and run with Aspire (orchestrates all services)
dotnet build
aspire run

# Run individual services
dotnet run --project src/WebApi/WebApi.csproj
dotnet run --project src/Worker/Worker.csproj

# Run tests
dotnet test

# Run specific test
dotnet test --filter "FullyQualifiedName~TestClassName"
```

## Verification Rules

**CRITICAL:** After any changes to `backend/` or `aspire/` projects, you MUST run Aspire to verify the application starts correctly:

```bash
# Always run this after backend/aspire changes
dotnet run --project aspire/KbRag.Aspire.AppHost/KbRag.Aspire.AppHost.csproj
```

**Verification checklist:**
- ✅ Build succeeds with no warnings or errors
- ✅ Aspire AppHost starts successfully
- ✅ Dashboard is accessible (shows URL in output)
- ✅ No runtime exceptions in the output logs
- ✅ Stop the process with Ctrl+C after verification

**When to skip verification:**
- Only changing test files
- Only changing documentation
- Trivial formatting changes (e.g., whitespace)

### Project Structure

```
├── aspire/                   # Aspire orchestration/
├   ├── Aspire.AppHost/          # Aspire orchestration
├   ├── Aspire.ServiceDefaults/  # Aspire service defaults
├── frontend/                # Next.js application
├── backend/                 # .NET 10 api
├   ├── API/                  # ASP.NET Core minimal API
├   ├── Core/                    # Domain logic and interfaces
├   ├── Infrastructure/          # Qdrant, Microsoft Framework, file storage
├   └── Tests/                   # Unit and integration tests
└── KbRag.sln                   # Unit and integration tests
```

## Implementation Guidelines

### PDF Text Extraction
- Use `UglyToad.PdfPig` or `iText7` for robust parsing
- MVP supports text-based PDFs only (no OCR)
- Handle edge cases: multi-column layouts, embedded tables

### Vector Search Configuration
- Chunk size: ~1000 characters
- Overlap: 200 characters (prevents context breakage)
- Top-k results: 3 chunks per query
- Similarity threshold: Configure to filter low-relevance results

### Cost Optimization
- Use openai/gpt-oss-120b for cost efficiency
- Estimate: ~$0.15-0.50 per 1M tokens (vs $30 for GPT-4)
- Emphasize this cost advantage to clients

### Streaming Implementation
- Use Server-Sent Events (SSE) or SignalR
- Stream tokens directly from openrouter.ai to api and to frontend
- Avoid buffering entire response before sending

## MVP Scope

### In Scope:
- Document upload via API endpoint
- Text extraction and chunking
- Vector embedding generation
- Semantic search with Qdrant
- Streaming chat responses
- Source citations
- "I don't know" fallback mechanism

### Out of Scope (Future Add-ons):
- OCR for scanned PDFs
- User authentication/RBAC (assumed internal tool)
- Complex admin UI (file management via API)
- Multi-user support
- Permission-based document access

## Key Dependencies

- **Microsoft Agent Framework:** AI orchestration and agent management
- **Qdrant Client:** Vector database operations
- **Aspire:** Distributed application orchestration

## Testing Strategy

**We use TDD aproche for backend and forntend.**

When implemented:
- Unit tests for chunking logic
- Integration tests for document pipeline
- API endpoint tests
- Vector search accuracy validation
- Citation format verification

## Documentation

- **README.md:** Comprehensive technical specification and business requirements
- **CLAUDE.md:** This file (guidance for Claude Code)
- **.docs/project** Project documentation

### Documentation Structure Convention

This project uses a structured documentation approach to track task progress and context across development sessions.

```
.docs/
└── project/
    └── tasks/
        └── [task-name]/
            ├── [task-name].md           # Task description/design
            ├── progress.md              # Phase progress tracking
            └── summary.md               # Session summaries
```

#### File Types

**1. Task Description (`[task-name].md`)**
- Design document or task specification
- Contains phases, requirements, and implementation details
- Example: `.docs/project/tasks/chat-ui/ai-chat-interface-design.md`

**2. Progress Tracking (`progress.md`)**
- Tracks completion status of each phase
- Tables showing task completion status
- Test results and metrics
- Blockers and known issues
- Updated as phases are completed

**3. Session Summary (`summary.md`)**
- Updated after each work session on the task
- Contains:
  - What was done (list of implementations)
  - Key decisions made with rationale
  - Current state (build status, test results)
  - File paths reference
  - Technical debt / known issues
  - Notes for next agent

#### When Working on Tasks

1. **Before starting work:** Read the task description and latest summary files
2. **During work:** Track progress in the progress.md file as you complete phases
3. **After work:** Update summary.md with:
   - Session date and agent info
   - What was implemented
   - Decisions made (with reasoning)
   - Current state (build status, test results)
   - File paths for all created/modified files
   - Any blockers or issues encountered
   - Next steps for the next agent

#### Benefits

- **Context Preservation:** Each agent understands what was done and why
- **Decision Trail:** Rationale for key decisions is documented
- **Continuity:** Work can resume across multiple sessions/agents seamlessly
- **Traceability:** File paths and implementation details are readily accessible

## Available Specialized Agents

This project includes specialized subagents located in `.claude/agents/` that can be invoked for specific tasks:

### aspire-guide
**Purpose:** Elite .NET Aspire expert for debugging, configuring, and optimizing Aspire applications with MCP integration.

**When to use:**
- Configuring services in Aspire (e.g., "How do I add a Redis cache to my Aspire application?")
- Debugging Aspire applications (e.g., "My Aspire dashboard shows the API service is unhealthy")
- Implementing Aspire-specific features (e.g., service discovery, resource management)
- Questions about Aspire best practices and configuration management

**Key capabilities:**
- Access to latest Aspire documentation via MCP
- Real-time application status monitoring and log analysis
- Structured debugging with code samples
- Service orchestration and health check guidance

### browser-automation
**Purpose:** Expert browser automation specialist for testing running web applications and interacting with web pages.

**When to use:**
- Testing newly implemented features (e.g., "I just added a login form, can you test it?")
- Opening and inspecting specific URLs (e.g., "Open https://example.com and tell me what's on the page")
- Verifying UI functionality and user flows (e.g., "Check if the submit button is working on the checkout page")
- Debugging frontend issues through browser interaction

**Key capabilities:**
- Navigate to URLs and capture page state
- Execute browser actions (click, fill forms, take screenshots)
- Test multi-step user flows
- Verify UI elements and interactions

### frontend-architect
**Purpose:** Elite Frontend Architect specializing in modern React development with shadcn UI and Vercel best practices.

**When to use:**
- Designing and implementing UI components (e.g., "Create a user profile page with edit capabilities")
- Integrating shadcn UI components (e.g., "Add a data table component for displaying user information")
- Reviewing React code quality and performance (e.g., "Review this component for performance issues")
- Getting frontend implementation guidance (e.g., "How should I handle state management for this multi-step form?")

**Key capabilities:**
- Expert shadcn UI integration and customization
- React best practices and performance optimization
- Web design guidelines and accessibility standards
- **Automated testing:** Always launches the app and uses @browser-automation to test functionality after building features

### microsoft-agent-framework-analyst
**Purpose:** Elite Microsoft Agent Framework Technical Analyst for navigating, analyzing, and synthesizing complex technical documentation.

**When to use:**
- Implementing multi-agent orchestration (e.g., "How do I set up a multi-agent system where one agent delegates tasks?")
- Designing error handling patterns (e.g., "What's the best practice for handling failures and retries in agent workflows?")
- Implementing state management (e.g., "How should I manage conversation state across multiple agent interactions?")
- Architectural guidance for agent-based systems

**Key capabilities:**
- Access to local Microsoft Agent Framework documentation
- Microsoft Learn official documentation integration
- Microsoft API references and code samples
- Comprehensive implementation reports with code examples

## Important Notes

1. **Privacy is Paramount:** All data stays within client's cloud environment
2. **Citations Build Trust:** Make citations prominent/clickable in the UI
3. **Keep UI Clean:** Simple chat interface, skeleton loaders during first token wait
4. **Latency Matters:** RAG can be slow; streaming is essential for UX
5. **Qdrant vs Azure AI Search:** Qdrant ($5-10/mo) is much cheaper than Azure AI Search ($200+/mo) for MVP
