# 🎓 EduMethod AI - AI-Powered Personalized Learning Platform

> An intelligent learning assistant that transforms raw syllabus text/images into structured learning paths, adaptive quizzes, and step-by-step problem solutions.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38b2ac?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)

---

## 🚀 Live Demo

**[EduMethod AI Live](https://edumethod-ai.vercel.app)** — Try it now!

---

## ✨ Core Features

### 1. **Smart Topic Extraction**

- Upload syllabus text or paste content
- AI automatically extracts and categorizes topics
- Assigns difficulty levels (easy/medium/hard)
- Estimates study time for each topic

### 2. **AI-Powered 7-Day Learning Path Generator**

- Generates optimal study schedule using **interleaving** principle
- Mixes related topics for better retention
- Includes study methods (active recall, spaced repetition)
- Daily learning hacks and mnemonics

### 3. **Adaptive Quiz System**

- AI generates 5 conceptual questions (not just memorization)
- Tracks weak topics automatically
- Identifies areas needing focus
- Never sends answer keys to frontend (server-side security)

### 4. **Intelligent Doubt Solver**

- Ask questions via text or upload problem images
- AI provides **step-by-step solutions** with explanations
- Maintains conversation history for follow-ups
- Uses Groq for text (fast), Gemini for images (accurate)

### 5. **Production-Ready Security**

- Clerk authentication for user sessions
- Supabase RLS policies for data isolation
- Never exposes API keys or answers in frontend
- User-specific data access control

---

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Responsive UI (desktop + mobile)
- **Zod** - Runtime input validation
- **React Hook Form** - Form state management

### **Backend & APIs**

- **Next.js API Routes** - Serverless backend
- **Supabase** - PostgreSQL database + auth
- **Groq LLM** - Fast text generation
- **Google Gemini Vision** - Image understanding
- **Clerk** - User authentication

### **Deployment**

- **Vercel** - Hosting & serverless functions
- **PostgreSQL** - Data persistence
- **Environment-based secrets** - Secure configuration

---

## 📋 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/rajendrabist07/edumethod-ai.git
cd edumethod-ai
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SECRET_KEY=your_secret

# AI APIs
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
edu-method-ai/
├── app/
│   ├── (dashboard)/
│   │   ├── upload/           # Topic extraction UI
│   │   └── doubt-solver/     # Doubt solver chat UI
│   ├── api/
│   │   ├── topics/           # Extract topics
│   │   ├── generate-path/    # 7-day plan
│   │   ├── generate-quiz/    # Quiz questions
│   │   ├── submit-quiz/      # Check answers
│   │   └── solve-doubt/      # Step-by-step solutions
│   ├── sign-in/ & sign-up/   # Clerk auth pages
│   ├── error.tsx             # Global error boundary
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── lib/
│   ├── groq.ts               # Groq client
│   ├── gemini.ts             # Gemini client
│   ├── supabase.ts           # Supabase client
│   └── supabase-admin.ts     # Supabase admin
├── components/               # UI components
├── types/                    # TypeScript types
└── .env.local               # ⚠️ Not in git
```

---

## 🔄 Data Flow

**Topic Extraction → 7-Day Plan → Quiz → Doubt Solver**

Each module stores data in Supabase with user isolation.

---

## 📱 Responsive Design

✅ **Fully responsive** across all devices:

- Desktop (1024px+): Full layouts
- Tablet (768px-1023px): Touch-optimized
- Mobile (<768px): Single column, large buttons

All components use Tailwind breakpoints (`sm:`, `md:`, `lg:`).

---

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com/rajendra-bists-projects)
2. Click "Add New Project"
3. Select your `edumethod-ai` repo
4. Click "Import"

### Step 3: Set Environment Variables

In Vercel dashboard, add all variables from `.env.local`

### Step 4: Deploy

Click "Deploy" — live in 2-3 minutes!

### Step 5: Update Clerk Production Keys

1. Go to Clerk Dashboard
2. Add your Vercel domain to allowed domains
3. Copy production keys
4. Update Vercel environment variables

---

## ✅ Pre-Deployment Checklist

- [ ] All features work locally (`npm run dev`)
- [ ] Sign up/login works
- [ ] Topic extraction works (both text & image)
- [ ] 7-day plan generation works
- [ ] Quiz generation & submission works
- [ ] Weak topic detection works
- [ ] Doubt solver works (text mode at minimum)
- [ ] Mobile UI responsive (inspect → device toolbar)
- [ ] Error messages show gracefully (no blank screens)
- [ ] `.env.local` NOT in git (verify with `git log --all -- .env.local`)
- [ ] README.md is comprehensive
- [ ] Build succeeds (`npm run build`)

---

## 🧪 Usage Examples

### Extract Topics

```
/upload → Enter subject & syllabus → Click generate
```

### Take Quiz

```
/upload → Generate path → "Take a Quiz" → Answer questions → See weak areas
```

### Ask Doubt Solver

```
/doubt-solver → Type question → Get step-by-step answer
```

---

## 🔐 Security Features

✅ Authentication via Clerk  
✅ Database user isolation  
✅ Answer keys stored server-side only  
✅ Zod input validation  
✅ Environment variable protection  
✅ Rate limit error handling

---

## 📊 Learning Science

- **Interleaving**: Mix topics for 40% better retention
- **Spaced Repetition**: Quiz scheduling
- **Active Recall**: Multiple-choice practice
- **Elaboration**: Step-by-step explanations
- **Metacognition**: Weakness detection

---

## 🐛 Troubleshooting

| Issue                       | Solution                              |
| --------------------------- | ------------------------------------- |
| "Invalid input" error       | Enter at least 5 characters           |
| "Quota exceeded"            | Gemini free tier limit. Use text mode |
| Blank doubt solver response | Check API keys in `.env.local`        |
| Supabase connection error   | Verify credentials                    |
| Mobile UI overflow          | Check browser zoom (should be 100%)   |

---

## 📄 License

MIT License - use freely for projects.

---

## 👤 Developer

**Rajendra Bist** - Full-Stack AI Engineer  
[GitHub](https://github.com/rajendrabist07) • Portfolio • Email

---

## 📚 Resources

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Clerk](https://clerk.com/docs)
- [Groq API](https://console.groq.com/keys)
- [Gemini API](https://makersuite.google.com/app/apikey)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

_Production-ready. Deployed with ❤️_
