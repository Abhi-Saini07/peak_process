# Setting up GitHub, Vercel, Neon and Clerk

Step-by-step guide for moving this project (Peak Process Partners onboarding and careers app) to a **new GitHub repo**, a **new Vercel project**, a **Neon** PostgreSQL database and **Clerk** for HR admin sign-in.

**What the app needs in production:**

| Piece | What it is | Where it lives |
|---|---|---|
| Code | Next.js 16 app | GitHub → Vercel |
| Database | **PostgreSQL** (Prisma) | Neon |
| HR admin sign-in | Clerk | Clerk (who is an admin: `ADMIN_EMAILS`) |
| File storage | Resumes and onboarding documents | An **S3-compatible bucket** (MinIO, Cloudflare R2, etc.). Vercel can't store uploaded files on disk. |
| Secrets | `ENCRYPTION_KEY` etc. | Vercel → Settings → Environment Variables |

Commands below are for **Git Bash on Windows**, run from the project folder (e.g. `cd /e/peak_process_101`).

---

## 0. Before you start

- Install **Git**, and **Node.js 20 or newer** (the project is tested on 22). Check with `node -v` and `git --version`.
- Have your working local copy on the branch you want to go live, and make sure it runs (`npm run dev`).
- Use the code with Neon + Clerk: the `claude/neon-clerk` branch (or `master`, once that branch is merged). Step 2 publishes it as the new repo's `main` branch.

---

## 1. Create the new GitHub repository

1. Sign in to the new GitHub account → **New repository**.
2. Name it (e.g. `peak_process_101`) and choose **Private**.
3. **Do not** add a README, .gitignore or licence. The repo must start empty.
4. Click **Create repository** and copy its URL, e.g. `https://github.com/NEW-ACCOUNT/peak_process_101.git`.

---

## 2. Push the code to the new repo

```bash
cd /e/peak_process_101
git status                      # must say "working tree clean"
git checkout claude/neon-clerk
git pull                        # get the latest

# keep the old GitHub as "old-origin", add the new one as "origin"
git remote rename origin old-origin
git remote add origin https://github.com/NEW-ACCOUNT/peak_process_101.git

# publish it as the new repo's main branch
git push -u origin claude/neon-clerk:main
```

- Git will ask you to sign in to the **new** GitHub account. Use the browser pop-up, or a Personal Access Token as the password.
- Optional, to copy every branch as well: `git push origin --all`.
- Check on GitHub that the files are there. `.env` must **not** be there: it's in `.gitignore` and must never be committed.

From now on work on `main` locally:

```bash
git checkout -b main origin/main
```

---

## 3. Create the Neon database

1. Sign in at neon.tech with the company account → **New project** (region close to your users, e.g. Singapore / Mumbai if offered).
2. Database name: `peak_process`.
3. On the project dashboard click **Connect** and copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`
   - **Direct** (toggle "Connection pooling" off) → this is `DIRECT_URL`

   Both look like `postgresql://USER:PASSWORD@HOST/peak_process?sslmode=require`.

Neon accepts connections from anywhere by default, so Vercel can reach it.

---

## 4. Create the tables

Run once from your PC against Neon (values inline, so your local `.env` is untouched):

```bash
DATABASE_URL="POOLED-URL" DIRECT_URL="DIRECT-URL" npx prisma migrate deploy
```

**Encryption key** (encrypts Aadhaar / PAN / UAN) — generate a new one:

```bash
node.exe -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store it in a password manager. **If you lose this key, encrypted data can't be read again.** (Moving existing data? Reuse the old key instead — step 9.)

Optional: `npx prisma db seed` (same inline `DATABASE_URL`, `DIRECT_URL`, `ENCRYPTION_KEY`) adds **three demo employees** for testing. Don't run it on the real production database, or remove them afterwards:

```sql
DELETE FROM employees WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333');
```

---

## 4b. Set up Clerk (HR admin sign-in)

1. Sign in at clerk.com with the company account → **Create application** (name: Peak Process Partners HR). Choose **Email** (and optionally Google) as sign-in options.
2. **Configure → Restrictions → Sign-up mode: Restricted**, so nobody can create an account on their own.
3. **Users → Invite** each HR person by email. They get an email to set their password.
4. **API keys** page: copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
5. Decide the admin list: every HR email that should see the admin, comma-separated — this is `ADMIN_EMAILS`. Someone who signs in but isn't on the list sees a "No HR access" page.

Clerk gives you a **Development** instance first. Use it for previews; before launch, create the **Production** instance in Clerk (it asks you to add a domain and a few DNS records), and use its keys for Vercel Production.

---

## 5. Create the file storage bucket

Resumes and documents go to an S3-compatible bucket, such as your existing MinIO server, Cloudflare R2 or Backblaze B2.

1. Create a **private** bucket (e.g. `peak-process-documents`).
2. Create an access key with read/write access to that bucket only.
3. Note these four values:
   - `MINIO_ENDPOINT`: the host only, **no `https://`** (e.g. `minio.yourcompany.com`). The app adds `https://` itself and uses path-style URLs.
   - `MINIO_ACCESS_KEY`
   - `MINIO_SECRET_KEY`
   - `MINIO_BUCKET`

---

## 6. Create the Vercel project

1. Sign in to Vercel (ideally *Continue with GitHub*, using the new GitHub account).
2. **Add New… → Project** → import the new `peak_process_101` repo. If it's not listed, click *Adjust GitHub App Permissions* and give Vercel access to it.
3. **Framework preset:** Next.js (auto-detected). Leave the Build Command, Output Directory and Install Command as the defaults. `npm run build` automatically runs `prisma generate` first (the `prebuild` script).
4. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value | Required |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** string (step 3) | yes |
| `DIRECT_URL` | Neon **direct** string (step 3) | yes |
| `ENCRYPTION_KEY` | key from step 4 | yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (step 4b) | yes |
| `CLERK_SECRET_KEY` | Clerk (step 4b) | yes |
| `ADMIN_EMAILS` | e.g. `hr@company.com,lead@company.com` | yes |
| `MINIO_ENDPOINT` | host only, no `https://` | yes |
| `MINIO_ACCESS_KEY` | from step 5 | yes |
| `MINIO_SECRET_KEY` | from step 5 | yes |
| `MINIO_BUCKET` | from step 5 | yes |
| `SESSION_COOKIE_NAME` | `ppp_session` | optional (default) |

- Set them for **Production**. Also tick **Preview** if you want preview deployments (other branches) to work. Without these variables, preview sites show errors.
- **Don't** set `NEXT_PUBLIC_PERSISTENCE_MODE` (that's only for offline demos).

5. Click **Deploy** and wait for "Ready".
6. **Settings → Git → Production Branch** must be `main`. Only that branch updates the live site; other branches get preview URLs.

---

## 7. Check the live site

Open the Vercel URL and test each area:

- [ ] `/jobs`: careers page loads, with the Canopy design.
- [ ] `/admin/login`: sign in with an invited Clerk account whose email is in `ADMIN_EMAILS`.
- [ ] Sign in with an account **not** in `ADMIN_EMAILS` → you should see "No HR access".
- [ ] `/admin/jobs/new`: create a job, set it to **Published**, and save.
- [ ] `/jobs`: the new job appears. Open it and **apply with a resume** (this tests the database and file storage).
- [ ] `/admin/jobs` → Applications: the application is listed and the resume **downloads**.
- [ ] `/onboarding/welcome` → go through a step and reload; the data is still there.
- [ ] `/onboarding/documents`: upload a file (this tests storage again).

---

## 8. Custom domain (optional)

Vercel → Project → **Settings → Domains** → add e.g. `careers.yourcompany.com`, then add the DNS record Vercel shows at your domain registrar. HTTPS is set up automatically.

---

## 9. Moving existing data (optional)

Only needed if the old environment has real data worth keeping.

1. **Database:** the old database is MySQL and Neon is PostgreSQL, so a plain dump/restore won't work. Run step 4 (create tables), then copy the rows table by table — e.g. with `pgloader` (it converts MySQL → PostgreSQL), or ask for a one-off copy script. Admin accounts don't need copying: HR people sign in with Clerk and their profile is created on first sign-in.
2. **`ENCRYPTION_KEY`:** use the **same key** as the old environment, or the encrypted Aadhaar/PAN/UAN values can't be read.
3. **Files:** copy all objects from the old bucket to the new one (e.g. `mc mirror` for MinIO, or `rclone copy`). Keep the same object keys, because the database stores them.

---

## 10. Day-to-day workflow after the move

```bash
git checkout -b my-change        # work on a branch
# ...edit, test locally with npm run dev...
git add -A && git commit -m "Describe the change"
git push -u origin my-change     # Vercel builds a preview URL
```

Open a Pull Request on GitHub → check the preview → **merge into `main`**, and Vercel updates the live site automatically.

Local development: see "Running it on your PC" below. Never point local development at the production database.

---

## Running it on your PC (PostgreSQL + Clerk)

XAMPP's MySQL no longer works — the app now needs PostgreSQL. Two options:

- **Easiest:** a free personal Neon project just for development (neon.tech → New project → copy the pooled and direct strings).
- **Offline:** install PostgreSQL for Windows (postgresql.org/download/windows), create a database `peak_process`, and use `postgresql://postgres:YOUR-PASSWORD@localhost:5432/peak_process` for both URLs.

Then in `.env` (copy `.env.example`):

```
DATABASE_URL="..."
DIRECT_URL="..."
ENCRYPTION_KEY="..."
ADMIN_EMAILS="you@example.com"
# leave the two CLERK_ keys commented out locally
```

```bash
npx prisma migrate deploy      # create tables
npx prisma db seed             # optional demo employees
npm run dev
```

Open `http://localhost:3000/admin/login`. With no Clerk keys set, Clerk runs in **keyless development mode**: sign up with the email you put in `ADMIN_EMAILS`, verify it with the code Clerk emails you, and you're in. (A small Clerk banner offers to "claim" the app — that's how the dev keys later move into the company Clerk account.)

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Build fails: `@prisma/client did not initialize yet` | `prisma generate` didn't run. Keep the default build command (`npm run build`, which runs `prebuild`). |
| `P1001: Can't reach database server` | Wrong host, or `?sslmode=require` missing from the Neon URL. Neon projects also "sleep" when idle; the first request may take a few seconds. |
| `prisma migrate` hangs or errors on Neon | Use the **direct** string as `DIRECT_URL` (the pooled one can't run migrations). |
| `Clerk keys are missing from your environment` | Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Vercel (both Production and Preview), then redeploy. |
| Signed in but "No HR access" | That email isn't in `ADMIN_EMAILS` (or isn't verified in Clerk). Add it in Vercel → redeploy. |
| `P1000: Authentication failed` | Wrong user/password, or special characters in the password that aren't URL-encoded. |
| Error pages mentioning `ENCRYPTION_KEY` | The variable is missing or isn't a 32-byte base64 key (step 4). |
| Upload or download fails | One of the `MINIO_*` variables is missing or wrong. The endpoint must have **no** `https://`; check the bucket name and key permissions. |
| `/jobs` shows 404 or the old design | The wrong branch is deployed. Check Settings → Git → Production Branch = `main`, then redeploy. |
| Preview deployment errors, production fine | The environment variables are only set for Production. Also tick **Preview** (step 6). |
| Changed an environment variable but nothing changed | Redeploy: Deployments → ⋯ → **Redeploy**. Variables only apply to new deployments. |
