# Observing India

A collaborative publication platform for students exploring campus life, culture, scholarships, identity, and academic systems in India.

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- NextAuth credentials authentication
- Markdown support via `react-markdown`

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `MONGODB_URI` and `NEXTAUTH_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Run the app locally:

```bash
npm run dev
```

5. Open http://localhost:3000

## Features

- Minimal editorial UI
- Login and registration for contributors
- Publish essays with Markdown support
- Post listing and article reading experience
- MongoDB-backed user and post models
