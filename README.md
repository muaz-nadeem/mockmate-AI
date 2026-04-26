# MockMate - AI Mock Interview Platform

<div align="center">
  <img src="https://img.shields.io/badge/-Next.JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=black" alt="next.js" />
  <img src="https://img.shields.io/badge/-Vapi-white?style=for-the-badge&color=5dfeca" alt="vapi" />
  <img src="https://img.shields.io/badge/-Firebase-black?style=for-the-badge&logoColor=white&logo=firebase&color=DD2C00" alt="firebase" />
  <img src="https://img.shields.io/badge/-Gemini-black?style=for-the-badge&logoColor=white&logo=google&color=4285F4" alt="gemini" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
</div>

<br />

MockMate is an AI-powered mock interview platform that conducts real-time voice interviews and generates structured, data-driven feedback. The system uses **Vapi** for voice-based AI interviewing, **Firebase** for data persistence and authentication, and **Google Gemini** for intelligent transcript analysis and feedback generation.

---

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [System Data Flow](#system-data-flow)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)

---

## Technical Architecture

MockMate is built as a full-stack Next.js 15 application using the App Router with server actions, server components, and client components working together to create a seamless interview experience.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Auth Pages   │  │  Dashboard   │  │  Interview Session    │ │
│  │  (Sign In/Up) │  │  (Home)      │  │  (Vapi Voice Client)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘ │
│         │                 │                      │              │
│         │     Vapi Web SDK streams voice ────────┤              │
│         │     + captures transcript in state     │              │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER (App Router)                   │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  Server Actions   │  │  API Routes                        │  │
│  │  (lib/actions/)   │  │  /api/vapi/generate (webhook)      │  │
│  │                   │  │                                    │  │
│  │  • auth.action.ts │  │  Receives Vapi voice workflow POST │  │
│  │  • general.action │  │  → generates questions via Gemini  │  │
│  │    .ts            │  │  → saves interview to Firestore    │  │
│  └────────┬─────────┘  └──────────────┬─────────────────────┘  │
│           │                           │                         │
└───────────┼───────────────────────────┼─────────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐    ┌────────────────────────┐
│   FIREBASE (Backend)  │    │   GOOGLE GEMINI (LLM)  │
│                       │    │                        │
│  Auth: Session Cookies│    │  gemini-2.0-flash-001  │
│                       │    │                        │
│  Firestore:           │    │  • Question generation │
│  ├── users/           │    │  • Transcript analysis │
│  ├── interviews/      │    │  • Structured feedback │
│  ├── sessions/        │    │    with scoring schema │
│  └── feedback/        │    │                        │
└───────────────────────┘    └────────────────────────┘
```

### Component Architecture

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **UI** | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui | Server-rendered pages, client-side voice interaction, responsive layout |
| **Voice AI** | Vapi Web SDK, Deepgram (transcription), ElevenLabs (TTS), GPT-4 (conversation) | Real-time voice interview with live transcription |
| **Server Logic** | Next.js Server Actions, API Routes | Authentication, data operations, Gemini API calls |
| **Authentication** | Firebase Auth + Admin SDK | Email/password auth, session cookies (HTTP-only, 7-day expiry) |
| **Database** | Cloud Firestore | Interview records, session transcripts, feedback documents |
| **AI Analysis** | Google Gemini (via Vercel AI SDK) | Structured feedback generation with `generateObject()` and Zod schema validation |
| **Speech Feedback** | Web Speech API (browser-native) | Post-interview spoken summary of weak areas and scores |

---

## System Data Flow

### Flow 1: Interview Generation (via Vapi Voice Workflow)

```
User clicks "Start an Interview"
        │
        ▼
Vapi Voice Assistant activates (client-side SDK)
        │
        │  User describes: role, level, tech stack
        │
        ▼
Vapi Cloud Workflow → POST /api/vapi/generate
        │
        ▼
Server: generateText() → Gemini generates interview questions
        │
        ▼
Server: Saves interview document to Firestore
        │
        │  {
        │    role, level, type, techstack,
        │    questions: ["Q1", "Q2", ...],
        │    userId, finalized: true,
        │    coverImage, createdAt
        │  }
        │
        ▼
Interview appears on dashboard under "Your Interviews"
```

### Flow 2: Taking an Interview (Voice Session)

```
User clicks "View Interview" on a card
        │
        ▼
Server Component loads interview from Firestore
(questions, role, techstack, existing feedback if any)
        │
        ▼
Agent.tsx (Client Component) mounts
        │
        ├── Creates Vapi assistant with:
        │   • Deepgram Nova-2 transcriber
        │   • ElevenLabs "Sarah" voice (TTS)
        │   • GPT-4 conversation model
        │   • Interview questions injected into system prompt
        │
        ▼
User clicks "Call" → Vapi.start()
        │
        │  Real-time voice conversation
        │  Each final transcript message captured:
        │  vapi.on("message") → setMessages(prev => [...prev, msg])
        │
        ▼
User clicks "End" → Vapi.stop()
        │
        ▼
callStatus = FINISHED triggers feedback pipeline
```

### Flow 3: Feedback Generation Pipeline

```
Interview ends (callStatus === "FINISHED")
        │
        ▼
Step 1: saveSession() [Server Action]
        │
        │  Writes to Firestore: sessions/{sessionId}
        │  {
        │    interviewId, userId,
        │    messages: [{ role, content }, ...],
        │    status: "saved",
        │    createdAt, updatedAt
        │  }
        │
        ▼
Step 2: generateFeedbackForSession() [Server Action]
        │
        ├── Reads session transcript from Firestore
        ├── Updates session status → "analyzing"
        │
        ├── Calls Gemini via generateObject():
        │   • Formats transcript as structured text
        │   • Sends to gemini-2.0-flash-001
        │   • Uses Zod schema (feedbackSchema) to enforce output:
        │     {
        │       totalScore: number (0-100),
        │       categoryScores: [
        │         { name: "Communication Skills", score, comment },
        │         { name: "Technical Knowledge", score, comment },
        │         { name: "Problem Solving", score, comment },
        │         { name: "Cultural Fit", score, comment },
        │         { name: "Confidence and Clarity", score, comment }
        │       ],
        │       strengths: string[],
        │       areasForImprovement: string[],
        │       finalAssessment: string
        │     }
        │
        ├── Saves feedback to Firestore: feedback/{feedbackId}
        ├── Updates session: status → "completed", feedbackId
        │
        ▼
Client receives feedback object
        │
        ├── Renders "Interview Wrap-up" card with:
        │   • Total score
        │   • Final assessment
        │   • Areas to focus on
        │   • Strengths
        │
        ├── Speaks summary aloud via Web Speech API:
        │   window.speechSynthesis.speak(utterance)
        │   "Your score is X out of 100. [assessment]. [weak areas]."
        │
        ▼
User clicks "View full feedback"
        │
        ▼
Feedback page renders:
        ├── Score + date header
        ├── Final assessment (verdict highlighted if not suitable)
        ├── Filler word frequency chart (uh, um, like, I think, yeah, ok)
        ├── Full conversation transcript (from Firestore session)
        ├── Category-by-category breakdown with scores
        └── Areas for improvement
```

### Flow 4: Authentication

```
Sign Up:
  Client (Firebase Auth SDK) → createUserWithEmailAndPassword()
        │
        ▼
  Server Action: signUp() → saves user doc to Firestore users/{uid}

Sign In:
  Client → signInWithEmailAndPassword() → gets idToken
        │
        ▼
  Server Action: signIn()
        │
        ├── auth.getUserByEmail() validates user exists
        ├── auth.createSessionCookie(idToken, 7 days)
        └── Sets HTTP-only cookie: "session"

Every Page Load:
  Server: getCurrentUser()
        │
        ├── Reads "session" cookie
        ├── auth.verifySessionCookie(cookie, checkRevoked: true)
        ├── Reads user doc from Firestore
        └── Returns { name, email, id } or null → redirect to /sign-in
```

---

## Firestore Data Model

```
Firestore
├── users/{uid}
│   ├── name: string
│   └── email: string
│
├── interviews/{interviewId}
│   ├── role: string
│   ├── level: string ("Junior" | "Mid" | "Senior")
│   ├── type: string ("Technical" | "Behavioral" | "Mixed")
│   ├── techstack: string[]
│   ├── questions: string[]
│   ├── userId: string
│   ├── finalized: boolean
│   ├── coverImage: string
│   └── createdAt: ISO string
│
├── sessions/{sessionId}
│   ├── interviewId: string
│   ├── userId: string
│   ├── messages: [{ role, content }]
│   ├── status: "saved" | "analyzing" | "completed" | "failed"
│   ├── feedbackId?: string
│   ├── createdAt: ISO string
│   └── updatedAt: ISO string
│
└── feedback/{feedbackId}
    ├── interviewId: string
    ├── userId: string
    ├── sessionId: string
    ├── totalScore: number (0-100)
    ├── categoryScores: [{ name, score, comment }]
    ├── strengths: string[]
    ├── areasForImprovement: string[]
    ├── finalAssessment: string
    └── createdAt: ISO string
```

---

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | **Next.js 15** (App Router, Turbopack) | Full-stack React framework with server components and server actions |
| Language | **TypeScript** | Type safety across client and server |
| Styling | **Tailwind CSS v4**, **shadcn/ui** | Utility-first CSS with pre-built accessible components |
| Voice AI | **Vapi Web SDK** | Real-time voice assistant (Deepgram STT + ElevenLabs TTS + GPT-4) |
| LLM | **Google Gemini** (via `@ai-sdk/google`) | Question generation and structured feedback analysis |
| AI SDK | **Vercel AI SDK** (`ai` package) | `generateText()` and `generateObject()` with Zod schema enforcement |
| Auth | **Firebase Auth** + **Firebase Admin SDK** | Email/password authentication with server-side session cookies |
| Database | **Cloud Firestore** | NoSQL document store for interviews, sessions, and feedback |
| Validation | **Zod** | Runtime schema validation for AI output and form data |
| Forms | **React Hook Form** + **@hookform/resolvers** | Form state management with Zod resolver |
| Date | **Day.js** | Lightweight date formatting |
| Notifications | **Sonner** | Toast notifications |
| Speech | **Web Speech API** (browser-native) | Post-interview spoken feedback summary |

---

## Features

- **Voice-Powered Interviews**: Real-time AI voice conversations using Vapi with Deepgram transcription and ElevenLabs text-to-speech
- **AI Question Generation**: Gemini generates role-specific interview questions tailored to the job level and tech stack
- **Automated Feedback Generation**: Every completed interview transcript is analyzed by Gemini to produce structured scores, strengths, weak areas, and a final assessment
- **Transcript Persistence**: Raw conversation transcripts are saved to Firestore as session documents, enabling re-analysis and review
- **Filler Word Analysis**: Visual bar chart tracking usage of filler words (uh, um, like, I think, yeah, ok) with total count and improvement tips
- **Spoken Summary**: After the interview ends, the browser reads the feedback aloud using the Web Speech API
- **Full Feedback Page**: Score header, highlighted verdict, conversation transcript, category breakdown, and actionable improvement areas
- **Session-Based Architecture**: Two-step pipeline — save transcript first, then analyze — so data is never lost even if the AI call fails
- **Retry on Failure**: If Gemini quota is exhausted or the call fails, the session is marked "failed" and can be retried without re-doing the interview
- **Secure Authentication**: Firebase email/password auth with HTTP-only session cookies and server-side verification on every request
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile

---

## Project Structure

```
ai_mock_interviews/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx          # Sign in page
│   │   ├── sign-up/page.tsx          # Sign up page
│   │   └── layout.tsx                # Auth layout (centered card)
│   ├── (root)/
│   │   ├── page.tsx                  # Dashboard (Your Interviews)
│   │   ├── layout.tsx                # App layout (nav + MockMate logo)
│   │   └── interview/
│   │       ├── page.tsx              # Interview generation (Vapi voice)
│   │       └── [id]/
│   │           ├── page.tsx          # Take interview (voice session)
│   │           └── feedback/page.tsx # Full feedback + transcript + chart
│   ├── api/vapi/generate/route.ts    # Vapi webhook (question generation)
│   ├── layout.tsx                    # Root layout (metadata, fonts, theme)
│   └── globals.css                   # Tailwind theme + component styles
├── components/
│   ├── Agent.tsx                     # Voice interview client (Vapi + feedback pipeline)
│   ├── AuthForm.tsx                  # Sign in / sign up form
│   ├── InterviewCard.tsx             # Interview card with score + badge
│   ├── DisplayTechIcons.tsx          # Tech stack icon display
│   ├── FillerWordsChart.tsx          # Filler word frequency bar chart
│   ├── FormField.tsx                 # Reusable form field
│   └── ui/                           # shadcn/ui components
├── constants/
│   ├── index.ts                      # Vapi assistant config, feedback Zod schema, tech mappings
│   └── demo.ts                       # Demo interview data
├── firebase/
│   ├── admin.ts                      # Firebase Admin SDK init (server-side)
│   └── client.ts                     # Firebase Client SDK init (browser-side)
├── lib/
│   ├── actions/
│   │   ├── auth.action.ts            # Auth server actions (signIn, signUp, getCurrentUser)
│   │   └── general.action.ts         # Interview + feedback server actions
│   ├── utils.ts                      # Utility functions (cn, tech icons, cover images)
│   └── vapi.sdk.ts                   # Vapi client instance
├── types/
│   ├── index.d.ts                    # Global TypeScript interfaces
│   └── vapi.d.ts                     # Vapi message types
└── public/                            # Static assets (logos, icons, covers)
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [Firebase Project](https://console.firebase.google.com/) with Auth + Firestore enabled
- [Vapi Account](https://vapi.ai/) with a voice workflow configured
- [Google AI Studio API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/muaz-nadeem/mockmate-AI.git
cd mockmate-AI/ai_mock_interviews
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=

GOOGLE_GENERATIVE_AI_API_KEY=

NEXT_PUBLIC_BASE_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

This project is for educational purposes.
 