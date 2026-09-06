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
npx prisma db push
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

Local development currently uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

For Supabase Postgres, update `prisma/schema.prisma` to use `provider = "postgresql"` and set:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

Then run:

```bash
npx prisma migrate dev --name init_supabase
npm run db:seed
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
