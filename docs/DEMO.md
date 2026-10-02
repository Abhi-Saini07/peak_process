# Demo guide

How to load the demo data on your PC and which pages to open when showing the
project. Every link below works as soon as the demo data is loaded, because the
demo rows always get the same IDs.

## 1. Load the demo data

Run this in **Command Prompt**, in the project folder:

```
cd /d E:\work\peak_process
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

- **Only on a local or test database, never the live one.** Check `DATABASE_URL` in
  `.env` first: it should be your local PostgreSQL or a Neon *dev* branch.
- The seed is safe to run again. It replaces only its own demo rows, and nothing
  else in the database is touched.
- **Run `npx prisma db seed` again on the morning of the demo.** Ages like
  "stuck for 12 days" and "applied 2 hours ago" are counted from when the seed
  ran, and anything you click during a rehearsal is reset.

What it creates: 5 published jobs (2 with screening questions), 30 candidates
spread over every stage, 5 flagged screening answers, 5 rejections with reasons
and 12 recruiter notes with ratings. Resumes are names only: there is no real
file behind them, so "download" on a demo resume shows an error.

## 2. Sign in for the HR pages

The HR pages (everything under `/admin`) need a Clerk sign-in with an email that
is listed in `ADMIN_EMAILS` in `.env`, for example:

```
ADMIN_EMAILS="it@katebaa.org"
```

Restart `npm run dev` after changing `.env`. Sign in once before the demo, so you
don't have to do it in front of the customer.

## 3. Pages to open

Copy any link into the browser while `npm run dev` is running.

### Careers site (public, no sign-in)

| Page | Link |
|---|---|
| All open jobs | http://localhost:3000/jobs |
| Senior Accountant (job with screening questions) | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000001 |
| Apply for Senior Accountant | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000001/apply |
| Payroll Specialist (deadline within a week) | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000002 |
| Tax Associate (remote job) | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000003 |
| HR Generalist | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000004 |
| Operations Analyst Intern | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000005 |
| Share preview image for a job | http://localhost:3000/jobs/5eed0001-0000-4000-8000-000000000001/opengraph-image |
| Privacy notice | http://localhost:3000/privacy |
| Sitemap (for Google) | http://localhost:3000/sitemap.xml |

### New-hire onboarding (public, no sign-in)

| Page | Link |
|---|---|
| Start onboarding | http://localhost:3000/onboarding/welcome |
| Onboarding dashboard | http://localhost:3000/dashboard |

Each browser gets its own onboarding, so a fresh one starts at step 1. Use a
private window for a clean start.

### HR recruitment (needs sign-in)

| Page | Link |
|---|---|
| Recruiter dashboard | http://localhost:3000/admin |
| All jobs | http://localhost:3000/admin/jobs |
| Post a new job (with screening questions) | http://localhost:3000/admin/jobs/new |
| Senior Accountant: edit job | http://localhost:3000/admin/jobs/5eed0001-0000-4000-8000-000000000001 |
| Senior Accountant: applications (List or Board) | http://localhost:3000/admin/jobs/5eed0001-0000-4000-8000-000000000001/applications |
| Payroll Specialist: applications | http://localhost:3000/admin/jobs/5eed0001-0000-4000-8000-000000000002/applications |

### Applications worth showing

| Candidate | What it shows | Link |
|---|---|---|
| Amit Chopra | Rejected for "Failed screening questions", screening flag, note with rating, full timeline | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000026 |
| Isha Desai | Under review, flagged screening answer: good one to **reject live** | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000009 |
| Nisha Khan | Shortlisted 12 days ago, two notes (5 and 4 stars) | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000015 |
| Pooja Nair | Stuck in Under Review for 16 days | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000013 |
| Riya Sharma | In interview for 15 days, low rating note | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000021 |
| Harsh Verma | Selected yesterday ("Offer accepted" note) | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000024 |
| Lakshmi Desai | Rejected for "Other", with the written reason | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000029 |
| Priya Sharma | Brand new today, flagged | http://localhost:3000/admin/applications/5eed0003-0000-4000-8000-000000000001 |

## 4. A 5-minute demo, in order

1. **Careers site** (`/jobs`): flip light and dark with the moon button, top right.
2. **Apply** for Senior Accountant: answer "No" to "Are you a qualified CA or CMA?",
   attach any PDF, tick the privacy box and submit. You get a reference number.
3. **Recruiter dashboard** (`/admin`): your application is at the top of "New to
   review" with a flag. Point out "Needs attention" and the deadline warning on
   Payroll Specialist.
4. **Board** (Senior Accountant applications, then "Board"): drag a card from
   Applied to Under Review. Try dragging it two columns ahead: it won't drop.
   Drag one onto Rejected and press **3** for "Compensation".
5. **Application detail** (Amit Chopra): screening answers, the timeline, then add a
   note with 4 stars.

The submission in step 2 needs file storage (the `MINIO_*` settings in `.env`).
Without it the form shows "We couldn't save your application", and nothing is
saved. Steps 3 to 5 work either way with the demo data.

Afterwards, `npx prisma db seed` puts the demo data back. It doesn't remove the
application you submitted live; that one is a normal row.
