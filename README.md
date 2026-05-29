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
2. Fill in `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and SMTP variables if using subscription confirmations.
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
- Strict single-admin rule: only `vincentlitabalia31@gmail.com` receives the effective admin role
- Contributor admin-request workflow stored in MongoDB
- Contributor dashboard with drafts, pending posts, published posts, rejected posts, and saved essays
- Markdown editorial publishing with draft, submit-for-review, publish, edit, and delete flows
- Admin moderation dashboard for posts, users, comments, featured essays, and content statistics
- Moderated nested comments, likes, bookmarks, notifications, search, categories, profiles, archive, sitemap, and robots
- Newsletter subscriptions with daily/weekly preferences and optional Resend delivery
- MongoDB-backed models with reusable Mongoose connection handling

## Admin setup

The only effective admin email is hard-set in code as `vincentlitabalia31@gmail.com`. All other accounts authenticate as contributors, even if an admin request is approved.

Admin requests are stored in MongoDB:

```txt
admin_requests/{id}
userId
email
status: pending | approved | rejected
createdAt
```

Admin routes are protected at `/admin` and `/api/admin/*` by the NextAuth session role.

## Email setup (password reset + newsletter)

Password reset and subscription confirmation emails require a configured provider.

**Recommended (Vercel + local): Resend**

```bash
RESEND_API_KEY=re_xxxxxxxx
NEWSLETTER_FROM="Observing India <newsletter@yourdomain.com>"
NEXTAUTH_URL=https://your-production-domain.com
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

**Alternative: SMTP**

```bash
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
EMAIL_FROM="Observing India <newsletter@yourdomain.com>"
```

Resend is preferred when set; SMTP is used as fallback. Without either, forgot-password and newsletter subscribe return a clear server error instead of failing silently.

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
