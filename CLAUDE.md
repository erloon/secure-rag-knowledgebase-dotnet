# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WHAT:** Secure RAG Knowledge Base - .NET 10 + Next.js 16
**WHY:** Privacy-first AI document Q&A with source citations
**HOW:** RAG pattern with Qdrant vector DB and Microsoft Agent Framework

## Tech Stack

- **Backend:** .NET 10, ASP.NET Core minimal API, .NET Aspire 13.1
- **Frontend:** Next.js 16, React 19, shadcn AI Elements (41 components)
- **AI:** Microsoft Agent Framework, openrouter.ai (gpt-oss-120b)
- **Vector DB:** Qdrant (Docker via Aspire)

## Project Conventions

- **.NET naming:** `KbRag` prefix (e.g., `KbRag.Aspire.AppHost`)
- **Frontend files:** kebab-case without prefix (e.g., `use-ai-chat.ts`)
- **Test projects:** `.Tests` suffix
- **Docker/services:** kebab-case (e.g., `qdrant-vector-store`)

## React/Next.js Development Conventions

**Critical - Phase 1.7 Best Practices (8 patterns):**

1. **Context Interface Completeness:** Expose ALL hook methods through context (see `frontend/contexts/AIChatContext.tsx:11-29`)
2. **Nullable Type Consistency:** Match nullable types across hook → context → component layers
3. **Context Value Memoization:** Always use `useMemo` for provider values to prevent re-renders
4. **Defer-Read Pattern:** Use `useRef` + `useEffect` for stable callbacks that read state (see `frontend/hooks/useAIChat.ts:55-61`)
5. **Type Helper Pattern:** Create reusable types in `types/components.ts` (e.g., `MemoizedComponent<T>`)
6. **Comprehensive Test Coverage:** Write tests for ALL changes (unit + component tests)
7. **Error State Exposure:** Always expose `error: Error | null` and `clearError()` through context
8. **Build Verification:** Run `npm run build` after frontend changes to catch TypeScript errors

## Architecture Overview

**High-Level RAG Flow:**
- **Ingestion:** Upload → Extract → Chunk → Embed → Qdrant
- **Query:** User Query → Vector Search → Context-Aware LLM → Streaming Response
- **Principles:** Citation-first, "I don't know" fallback, streaming, 3-5 turn context

**Reference:** `.docs/project/tasks/chat-ui/ai-chat-interface-design.md` for detailed architecture

## Project Structure

```
aspire/              # .NET Aspire orchestration
backend/             # .NET 10 API (Api, Core, Infrastructure layers)
frontend/            # Next.js 16 app (components/, hooks/, contexts/, types/)
.docs/               # Project documentation
  └── project/
      ├── architecture/    # Architecture patterns
      └── tasks/           # Task design docs, progress tracking, session summaries
```

## Development Commands

**Backend:**
```bash
dotnet run --project aspire/KbRag.Aspire.AppHost/KbRag.Aspire.AppHost.csproj
dotnet test
```

**Frontend:**
```bash
npm run dev
npm run build      # REQUIRED before commits
npm test
```

## Verification Rules

**CRITICAL: Backend Verification**
After any `backend/` or `aspire/` changes:
```bash
dotnet run --project aspire/KbRag.Aspire.AppHost/KbRag.Aspire.AppHost.csproj
```
Checklist: ✅ Build succeeds, ✅ AppHost starts, ✅ Dashboard accessible, ✅ No runtime errors

**CRITICAL: Frontend Verification**
After any `frontend/` changes:
```bash
npm run build && npm test
```
Checklist: ✅ No TypeScript errors, ✅ All tests pass, ✅ No linting errors

**Skip verification only for:** Test files, documentation, trivial formatting

## Testing Strategy

**TDD Approach:** Write tests BEFORE implementation
- Frontend: Jest + React Testing Library (unit + component tests)
- Backend: xUnit + Moq (unit + integration tests)
- Target: 80%+ coverage before marking tasks complete
- Run: `npm test` (frontend), `dotnet test` (backend)

**Frontend Testing - CRITICAL Configuration Notes:**

This project uses **Jest**, NOT Vitest. Always use Jest imports:

```typescript
// ✅ CORRECT - Use Jest imports
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

// ❌ WRONG - Do NOT use Vitest imports
import { describe, it, expect, beforeEach, vi } from "vitest"
```

**Why this matters:**
- The project is configured for Jest via `next/jest` wrapper
- Vitest imports (`vi`) will fail with "Cannot read properties of undefined" errors
- Always use `jest.fn()`, `jest.clearAllMocks()`, `jest.mock()` etc.
- This applies to ALL test files in `frontend/`

**Common Testing Pitfalls:**

1. **ESM Configuration Issues:** Some AI Elements components (e.g., `use-stick-to-bottom`, Badge, Carousel) have ESM dependencies that Jest cannot handle properly with `next/jest`
   - **Workaround:** Test what's actually testable; don't test full component rendering when ESLM issues occur
   - **Example:** Citation badge rendering tests fail because hover card content isn't rendered in test environment
   - **Solution:** Test component existence (`container.firstChild`) not specific internal DOM

2. **ReadableStream Mocking:** Jest has limitations mocking ReadableStream for complex streaming tests
   - **Issue:** Tests involving token-by-token stream updates are flaky
   - **Workaround:** Test streaming state management, not actual stream chunk processing
   - **Existing test coverage:** `useAIChat.test.ts` already tests streaming functionality adequately

3. **DOM Selectors for shadcn Components:** Badge and other UI components use `data-slot` attributes, not CSS classes
   - ❌ Wrong: `container.querySelector(".badge")` - Badge has no `badge` class
   - ✅ Correct: `container.querySelector('[data-slot="badge"]')` - Badge has `data-slot="badge"` attribute

**When to Simplify Tests:**
- If a test depends on AI Elements components rendering (hover cards, carousels) and consistently fails due to ESLM
- If a test requires complex ReadableStream mocking and becomes flaky
- If the functionality is already well-tested in existing test files
- Focus on testing YOUR code, not third-party components (shadcn AI Elements are already tested)

**Test Quality Guidelines:**
- ✅ DO test: Your custom components, hooks, state management, business logic
- ✅ DO test: Component renders without crashing, props are passed correctly
- ✅ DO test: User interactions, state changes, error handling
- ⚠️ AVOID: Testing internal rendering of third-party components (Badge, Carousel, etc.)
- ⚠️ AVOID: Complex ReadableStream chunk processing (test state management instead)

## Documentation Structure

**Session-Based Documentation Pattern:**
- **Task Description** (`[task-name].md`): Design spec with phases
- **Progress Tracking** (`progress.md`): Phase completion, test results, blockers
- **Session Summary** (`summary.md`): What was done, decisions made, current state, next steps

**Workflow:**
1. Before work: Read task description + latest summary
2. During work: Update progress.md
3. After work: Update summary.md with implementation details, decisions, file paths, blockers

**Location:** `.docs/project/tasks/[task-name]/`

## Specialized Agents

- **@aspire-guide:** Aspire orchestration, service configuration, debugging (MCP-enabled)
- **@browser-automation:** Browser testing, UI verification, user flow validation
- **@frontend-architect:** React/Shadcn UI implementation + automated testing (MANDATORY for UI work)
- **@microsoft-agent-framework-analyst:** Agent orchestration patterns

Invoke via Skill tool or @mention in conversation.

## Quick References

- **Full architecture:** `README.md` (business requirements, detailed tech specs)
- **Phase 1.7 conventions:** `.docs/project/phase-1.7-conventions.md` (React patterns with examples)
- **Chat UI design:** `.docs/project/tasks/chat-ui/ai-chat-interface-design.md`
- **Implementation progress:** `.docs/project/tasks/chat-ui/progress.md`

## Key Principles

1. **Privacy First:** All data stays within client's cloud environment
2. **Citations Build Trust:** Every answer includes source references
3. **Streaming Matters:** RAG can be slow; streaming is essential for UX
4. **TDD Discipline:** Tests before implementation, 80%+ coverage target
5. **Verify Before Committing:** Production build prevents CI failures
