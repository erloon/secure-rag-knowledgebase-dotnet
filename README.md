# Secure RAG Knowledge Base .NET

# Technical Specification:

Version: 1.0
Author: Senior .NET Architect
Type: Upwork Project Product / Portfolio Showcase

## 1. Project Overview & Business Value

### 1.1. Concept

A secure, private AI chatbot capable of answering questions based on internal company documents (PDF, DOCX, TXT). Unlike public ChatGPT, this system runs in the client's cloud environment (Azure/AWS), ensuring data privacy and zero data leakage to public model training sets.

### 1.2. Primary Business Goals

- **Knowledge Retrieval:** Reduce time spent searching for information in internal wikis/SharePoint by 80%.
- **Data Privacy:** Guarantee that sensitive data (contracts, HR policies) remains within the company's private cloud boundary.
- **Accuracy:** Provide answers with direct citations to source documents to eliminate "AI hallucinations."

### 1.3. Target Audience (Upwork Clients)

- **SMBs:** Law firms, HR departments, Consulting agencies needing quick access to procedures.
- **Enterprises:** Departments needing a "Sandbox" RAG solution before full-scale adoption.

## 2. Functional Requirements (Scope)

### 2.1. Core Features (MVP - The "Standard" Tier)

### A. Document Ingestion (The "Brain" Builder)

- **Upload Mechanism:** Simple API endpoint  to upload files.
- **Supported Formats:** PDF (Text-based), DOCX, Markdown, TXT.
- **Processing Pipeline:**
    - Text extraction.
    - Chunking (splitting text into manageable paragraphs, e.g., 500 tokens).
    - Embedding generation (converting text to vectors).
    - Indexing in Vector Database.

### B. The Chat Interface (The Experience)

- **Q&A Logic:** User asks a question -> System searches vector DB -> System prompts LLM with context -> LLM answers.
- **Streaming Responses:** The answer appears token-by-token (like ChatGPT) to reduce perceived latency.
- **Context Awareness:** Support for short conversation history (e.g., 3-5 turns) so the user can ask "Tell me more about that."

### C. Trust & Citations (The Differentiator)

- **Source Attribution:** Every answer MUST include a reference to the source file (e.g., `[Source: Employee_Handbook.pdf, Page 12]`).
- **"I Don't Know" Fallback:** If the answer is not in the documents, the AI must explicitly say: "I cannot find this information in the provided documents" rather than inventing facts.

### 2.2. Out of Scope for MVP (Future Add-ons)

- OCR for scanned PDFs (too expensive/slow for MVP).
- User Authentication / RBAC (Assumed internal tool or Basic Auth for showcase).
- Complex graphical Admin Panel for managing files (files managed via API).

## 3. Technical Architecture

### 3.1. Tech Stack

- **Backend:** .NET 10 (C#), ASP.NET Core minimal API.
- **AI Orchestration:** **Microsoft Agent Framework** https://github.com/microsoft/agent-framework
- **LLM:** Azure OpenAI
- **Embeddings:** Azure OpenAI text-embedding-3-large .
- **Vector Database:**
    - **Qdrant** (Running in a Docker Container via Aspire)
- **Frontend:** Nextjs, React (Simple Chat UI), document list, with Shadcn UI ready to use components
- Orchestration: Aspire in .NET
- Hosting: Dedicated VPS
- Storage: local disk

### 3.2. Architecture Diagram (RAG Flow)

```
sequenceDiagram
    participant User
    participant Frontend as Chat UI (React)
    participant API as .NET API (Semantic Kernel)
    participant VectorDB as Qdrant (Vector Store)
    participant LLM as Azure OpenAI

    Note over User, LLM: Phase 1: Ingestion (Upload)
    User->>API: Upload Document (PDF)
    API->>API: Extract Text & Chunk
    API->>LLM: Generate Embeddings
    LLM-->>API: Vector Data
    API->>VectorDB: Upsert Vectors + Metadata

    Note over User, LLM: Phase 2: Retrieval (Chat)
    User->>Frontend: "What is the policy on remote work?"
    Frontend->>API: Send Query
    API->>LLM: Generate Embedding for Query
    LLM-->>API: Query Vector
    API->>VectorDB: Search Nearest Neighbors (Top 3 Chunks)
    VectorDB-->>API: Return Context Text
    API->>LLM: Prompt: "Answer using this context..."
    LLM-->>API: Stream Answer + Citations
    API-->>Frontend: Display Stream

```

## 4. Implementation Details (The "How-To")

### 4.1. Semantic Kernel Setup

Use the `TextMemoryPlugin` or native RAG implementation in Semantic Kernel.

- **Kernel:** Builder with AzureChatCompletion.
- **Memory Store:** `QdrantMemoryStore`.

### 4.2. Chunking Strategy (Crucial!)

Don't just split by characters. Use a **Paragraph-based** or **Overlap** strategy.

- *Recommendation:* Chunk size ~1000 chars with 200 chars overlap. This ensures context isn't cut in the middle of a sentence.

### 4.3. The System Prompt

The prompt engineering is where the value lies.

```
You are a helpful corporate assistant.
You will be provided with context information enclosed in <context> tags.
You must answer the user's question ONLY based on this context.
If the answer is not in the context, say "I don't have enough information."
Do not use your outside knowledge.
Always cite the filename provided in the metadata.

```

## 5. Expert Recommendations & Review

*(Analysis from Product & AI Implementation Specialists)*

### 👨‍💻 Digital Product Specialist Review

- **Focus on the "Magic Moment":** The most important part of this demo is the **Citation**. When a user sees the bot cite the specific file they uploaded, trust skyrockets. Make the citation clickable (or at least highlighted).
- **Keep the UI Clean:** Don't clutter the chat. Just a simple input box and a clear stream of text. Use a skeleton loader while waiting for the first token.
- **Cost Control for Client:** Emphasize that you use **GPT-4o-mini**. It is significantly cheaper than GPT-4 but perfectly capable of RAG tasks. This is a huge selling point ("Enterprise AI for pennies").

### 🤖 AI Implementation Specialist Review

- **The "Junk In, Junk Out" Problem:** PDFs are notoriously hard to parse. For the MVP, prioritize **text-based PDFs**. If the parser fails (e.g., weird columns), the bot fails.
    - *Tip:* Use `UglyToad.PdfPig` or `iText7` in .NET for robust parsing.
- **Vector DB Choice:** Using **Qdrant** in a Docker container (e.g., via Azure Container Apps or even a VM) is much cheaper for a showcase/MVP ($5-10/mo) than a dedicated Azure AI Search instance ($200+/mo). This makes your offer much more attractive to SMBs.
- **Latency:** RAG can be slow. Ensure your .NET API supports **Server-Sent Events (SSE)** or SignalR to stream the response from OpenAI directly to the frontend. No one likes waiting 10 seconds for a spinning wheel.

## 6. Deliverable Checklist (For Upwork Project)

- [ ]  **.NET Solution:** Clean Architecture, separating Infrastructure (OpenAI/Qdrant) from Core Logic.
- [ ]  **Docker Compose:** File to spin up Qdrant locally for testing.