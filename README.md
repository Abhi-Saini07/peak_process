# Peak Process Partners — onboarding & careers

New-hire onboarding (7 steps), a public careers site, and an HR admin for job postings and applications.

- **Design:** Nocturne, with light and dark themes (toggle in the header/sidebar; follows the OS setting until you pick one).
- **Stack:** Next.js 16 (App Router), Tailwind CSS v4, PostgreSQL (Neon) via Prisma, Clerk for HR admin sign-in, S3-compatible storage (MinIO / R2) for uploads.

## Run locally

```bash
npm install
cp .env.example .env        # fill in the values (see the comments in the file)
npx prisma generate
npx prisma migrate deploy   # creates the tables
npm run dev
```

Open http://localhost:3000/jobs (careers), /dashboard (onboarding) and /admin/login (HR).

Full setup for GitHub, Vercel, Neon and Clerk: [docs/NEW-GITHUB-AND-VERCEL-SETUP.md](docs/NEW-GITHUB-AND-VERCEL-SETUP.md).
