# 🎓 EduMethod AI — Premium Cognitive EdTech Platform

<div align="center">

  <!-- Project Brand Logo / Banner SVG -->
  <svg viewBox="0 0 800 200" width="100%" height="150" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin-bottom: 24px;">
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <!-- Logo Symbol -->
    <g transform="translate(60, 55)">
      <path d="M40 10 L80 40 L80 90 L40 100 L0 90 L0 40 Z" fill="url(#logo-grad)" opacity="0.9" filter="url(#glow)"/>
      <path d="M40 25 L65 45 L65 80 L40 90 L15 80 L15 45 Z" fill="#0f172a" />
      <!-- Small spark detail -->
      <path d="M40 40 L45 52 L57 52 L47 59 L51 71 L40 63 L29 71 L33 59 L23 52 L35 52 Z" fill="url(#logo-grad)" />
    </g>
    <!-- Typography -->
    <text x="180" y="95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="4">EDUMETHOD AI</text>
    <text x="184" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" fill="#94a3b8" letter-spacing="6">INTELLIGENT COGNITION HUB</text>
  </svg>

  <p align="center">
    A production-grade, AI-powered learning workspace designed to transform unstructured syllabus syllabi, notes, and textbook captures into customized learning roadmaps, interactive flashcards, and conceptual quizzes.
  </p>

  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2_(Turbopack)-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-10b981?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://clerk.com"><img src="https://img.shields.io/badge/Clerk-Authentication-6c47ff?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk Auth" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38b2ac?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" /></a>
  </p>

  <h4>
    🚀 <strong><a href="https://edumethod-ai.vercel.app">Try the Live Workspace Platform</a></strong>
  </h4>

</div>

---

## 🏛️ Platform Architecture Blueprint

The platform separates frontend client layout panels from raw AI models using a resilient middle-layer gateway, backed by PostgreSQL session storage:

```mermaid
graph TD
    Client[Next.js Client Layout] -->|1. Request| Gateway[Resilient AI Gateway]
    Gateway -->|Log Telemetry| DB[(Supabase Postgres)]
    Gateway -->|2. Try Primary| Gemini[Google Gemini 2.5 Flash]
    Gemini -->|Quota Limit / Failure| Fallback[Groq Model Router]
    Fallback -->|3. Route Request| Qwen[Qwen 2.5 72B / Llama 3]
    Qwen -->|4. Stream Response| Gateway
    Gateway -->|5. Push Stream Chunks| Client
```

### 1. Unified AI Gateway Platform (`lib/ai/gateway.ts`)
Designed to handle experimental API limitations and network faults:
* **Fault-Tolerant Fallback Routing**: If Gemini returns a `429` (Quota Exception) or `503` service fault, the request immediately redirects to Groq providers.
* **Exponential Backoff Retry Pipeline**: Configured with jitter algorithms to resolve API request collisions.
* **Database Telemetry Logger**: Captures usage tokens, execution latency, model routers, and prompt histories in the `ai_request_logs` table.

### 2. Spaced Repetition Learning Engine (`lib/spaced-repetition.ts`)
EduMethod AI incorporates the **SuperMemo SM-2 Algorithm** to calculate optimal memory reinforcement schedules:
* **Memory Retention Interval ($I$)**:
  $$I(1) = 1, \quad I(2) = 6, \quad I(n) = I(n-1) \times EF$$
* **Easiness Factor Adjustment ($EF$)**:
  $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
  *(where $q$ represents user response quality graded from 0 to 5)*
* **Weak Topic Isolation**: Incorrectly answered quiz questions automatically update the database schema, generating high-priority flashcard decks.

---

## 📂 Database Schema Entity Relationship

The database is built on PostgreSQL with Clerk user isolation. Supabase **Row Level Security (RLS)** prevents cross-tenant access:

```
                  ┌──────────────────────┐
                  │    user_profiles     │
                  └──────────┬───────────┘
                             │ (1:1)
     ┌───────────────────────┼───────────────────────┐
     │ (1:N)                 │ (1:N)                 │ (1:N)
┌────▼─────────────────┐┌────▼─────────────────┐┌────▼─────────────────┐
│    learning_paths    ││    doubt_sessions    ││   flashcard_decks    │
└──────────┬───────────┘└──────────────────────┘└──────────┬───────────┘
           │ (1:N)                                         │ (1:N)
┌──────────▼───────────┐                        ┌──────────▼───────────┐
│       quizzes        │                        │      flashcards      │
└──────────────────────┘                        └──────────────────────┘
```

---

## 🛠️ Technology Catalog & Standards

### Client Layer
* **Framework**: Next.js 16.2.10 (configured with Turbopack for compilation and HMR).
* **React Engine**: React 19.2.4 (supporting server actions and concurrent suspense pipelines).
* **Style Engine**: Tailwind CSS v4.0. Custom class-based dark mode configurations resolve OS-level media overrides:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
* **Forms & Types**: React Hook Form linked with Zod client schema validators.

### Storage & Server Layer
* **Auth Platform**: Clerk Middleware (JWT authorization token verifications).
* **Database**: Supabase PostgreSQL with schema migrations managed via Prisma ORM.
* **Caching & Rate Limiting**: Upstash Redis (Sliding-window token bucket algorithm).

---

## 🚀 Step-by-Step Installation

### 1. Prerequisites
Ensure you have Node.js 18+ and a running PostgreSQL/Supabase database.

### 2. Clone and Setup Dependencies
```bash
git clone https://github.com/rajendrabist07/edumethod-ai.git
cd edumethod-ai
npm install
```

### 3. Environment Setup
Create a `.env.local` file inside the root directory:
```env
# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database Connection Keys (Prisma + Supabase)
DATABASE_URL="postgres://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?schema=public"
NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SECRET_KEY=eyJhbGci...

# LLM Providers Keys
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# Upstash Redis Configuration (Ratelimiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### 4. Database Sync
Apply database schema configurations to your Supabase instance:
```bash
npx prisma db push
```

### 5. Running the Workspace
```bash
# Start Turbopack local development server
npm run dev

# Build production distribution bundles
npm run build
```

---

## 📡 API Core Routes

| Route | Method | Payload | Function |
| :--- | :--- | :--- | :--- |
| `/api/topics` | `POST` | `{ subject: string, syllabus: string }` | Extracts and ranks core syllabus topics |
| `/api/generate-path` | `POST` | `{ pathId: string }` | Generates 7-Day interleaved plan |
| `/api/generate-quiz` | `POST` | `{ topic: string }` | Generates 5 conceptual questions |
| `/api/submit-quiz` | `POST` | `{ answers: Record<string, string> }` | Checks answers and isolates weak areas |
| `/api/solve-doubt` | `POST` | `{ message: string, socratic?: boolean }` | Multimodal query matching RAG context; Socratic guide toggle |
| `/api/feynman/evaluate` | `POST` | `{ topicName: string, userExplanation: string }` | Evaluates explanation simplicity and highlights logical leaps |
| `/api/cognitive-insights` | `POST` | `{ learningPathId: string }` | Extracts readability statistics and attention load density |
| `/api/history` | `GET` | *None (Reads user token)* | Returns combined learning paths & chats |

---

## 🧠 Premium Smart Learning Features (v2)

EduMethod AI introduces next-generation cognitive features built on top-tier learning science:

### 1. RAG-Cited Textbook Chat (Vector Search Pipeline)
The textbook chat integrates a robust Retrieval-Augmented Generation (RAG) system:
* **Vector Chunking & Storage**: Uploaded syllabus and textbook documents are segmented, parsed, and embedded using pgvector.
* **Semantic Retrieval**: User queries trigger a cosine similarity similarity match against syllabus chunks using the database-level `match_syllabus_chunks` RPC.
* **Source Citations**: The model dynamically references specific context sections, providing verified quotes alongside AI answers to guarantee source reliability.

### 2. Socratic Mode (Active Recall Prompting)
When Socratic Mode is active, the AI tutor transitions from a standard Q&A assistant to an inquisitive dialogue partner:
* **Guided Discovery**: Instead of providing direct answers, the tutor uses scaffolding techniques to guide students step-by-step.
* **Cognitive Load Optimization**: Breaks down complex conceptual hurdles into smaller, digestible micro-prompts.

### 3. Feynman Technique Evaluator (Simplicity Evaluator)
Named after Nobel physicist Richard Feynman, this module tests conceptual depth by asking students to explain topics in simple terms:
* **Simplicity Grading**: Evaluates readability and simplicity (graded on a scale of 0-100) based on vocabulary complexity, jargon density, and syllable count.
* **Logical Gap Detection**: Cross-references user explanations against matching pgvector reference chunks in the syllabus to identify missing key ideas.
* **Actionable Suggestions**: Provides specific guidelines on what parts need conceptual reinforcement.

### 4. Cognitive Readability Diagnostics (Load Analyzer)
Analyzes study material complexity to optimize learning budgets:
* **Metrics Computed**: Word count, unique term density, syllable density, and reading grade level estimation.
* **Study Recommendations**: Recommends attention block lengths (e.g. 25-minute Pomodoro for high density text vs. 50-minute for lighter materials).

### 5. Prism Liquid Glass UI/UX Theme
A custom designed visual system featuring:
* **Frosted Glass Aesthetics**: Translucent backings (`backdrop-blur(24px)`) and subtle gradient highlights that look premium in both Light and Dark mode.
* **Ambient Glows**: Hardware-accelerated radial glows that pulse slowly using custom CSS keyframes.

---

## 🔐 Security Protocols & RLS Checklists
> [!IMPORTANT]
> To guarantee complete multi-tenant isolation, the database implements database-level RLS policies on all tables, supplemented by server-side Clerk verification checks:
- **Tenant Validation**: Every API route extracts user sessions from the Clerk JWT. Raw client parameters are never trusted for user database indices.
- **Server-Side Verification**: Quiz answer key evaluation is kept server-side inside `/api/submit-quiz` (never exposed in JSON client payloads).
- **Environment Isolation**: API endpoints are routed through local Next.js Edge proxy servers to prevent token key leakage.

---

## 📄 License
This repository is licensed under the **MIT License**. Use freely for learning and enterprise integration.

---

<div align="center">
  <sub>Designed and Developed by <strong><a href="https://github.com/rajendrabist07">Rajendra Bist</a></strong>. Deployed on Vercel with ❤️</sub>
</div>
