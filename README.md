# IGM Treasure Hunt Quiz

A database-backed treasure-hunt quiz platform with participant play screens, clue-based scoring, multilingual answers, and a dedicated admin control room.

## Features

- Participant join flow with event codes
- Gamified quiz interface with chests, clues, score, and result pages
- English, Arabic, and Malayalam virtual keyboard support
- Accepted answer variants with normalized matching
- Admin login, event creation, question bank, leaderboard, and manual answer review
- Prisma database layer with seeded demo data

## Local Setup

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

## Admin

The seed script creates the admin from `.env`:

```env
ADMIN_EMAIL="admin@igm.local"
ADMIN_PASSWORD="admin123"
```

Change these before production.

## Database

This project uses Supabase Postgres through Prisma:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@REGION.pooler.supabase.com:5432/postgres"
```

For a new Supabase database, create and apply the first migration:

```bash
npx prisma migrate dev --name init_supabase
npm run db:seed
```

For deployment environments, apply committed migrations:

```bash
npx prisma migrate deploy
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run db:push
npm run db:seed
npm run db:studio
```

## Admin Workflow

See [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md) for the full quiz setup and live event workflow.
