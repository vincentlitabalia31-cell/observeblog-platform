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
2. Fill in `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
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
- JWT sessions with credentials auth and bcrypt password hashing
- Contributor dashboard with drafts, pending posts, published posts, rejected posts, and saved essays
- Markdown editorial publishing with draft, submit-for-review, publish, edit, and delete flows
- Admin moderation dashboard for posts, users, comments, featured essays, and content statistics
- Moderated nested comments, likes, bookmarks, notifications, search, categories, profiles, archive, sitemap, and robots
- Newsletter subscriptions with daily/weekly preferences and optional Resend delivery
- MongoDB-backed models with reusable Mongoose connection handling

## Admin setup

New accounts are created as contributors. To create an admin, update the user document in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Admin routes are protected at `/admin` and `/api/admin/*`.

## Newsletter setup

Subscriptions work with only MongoDB configured. To send email, add:

```bash
RESEND_API_KEY=your_resend_key
NEWSLETTER_FROM="Observing India <newsletter@yourdomain.com>"
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Admins can preview or send digests through `/api/admin/newsletter`.

## Deployment

1. Add the environment variables in Vercel.
2. Ensure MongoDB Atlas allows Vercel connections.
3. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy with the default Next.js preset.

## Validation

```bash
npm install
npm run build
npm run dev
```

Smoke-test registration, login, dashboard protection, post creation, admin moderation, comments, likes, bookmarks, search, and newsletter subscription.
