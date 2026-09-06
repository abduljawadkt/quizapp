# IGM Treasure Hunt Quiz Admin Guide

This guide explains how an admin can prepare, run, monitor, and close a quiz event using the IGM Treasure Hunt Quiz platform.

## 1. Admin Login

Open the admin panel:

```txt
/admin/login
```

For the current seeded admin account:

```txt
Email: admin@igm.local
Password: admin123
```

Change the admin password before using the platform for a real public event.

## 2. Admin Dashboard

After login, the dashboard shows:

- Total questions
- Total participants
- Completed attempts
- Live events
- Event creation form
- Existing event list

Use the dashboard to create new quiz rooms and manage event status.

## 3. Add Questions

Go to:

```txt
/admin/questions
```

Each question needs:

- Quiz set
- Question text
- Display answer in English
- Optional display answer in Arabic
- Optional display answer in Malayalam
- Category
- Points
- Accepted answers
- Clues

### Accepted Answers

Add multiple accepted answer versions so participants are not marked wrong for reasonable variations.

Example:

```txt
quran
koran
al quran
القرآن
ഖുർആൻ
ഖുര്‍ആൻ
```

The system automatically detects answer language:

- `EN` for English
- `AR` for Arabic
- `ML` for Malayalam

The system also normalizes answers before checking, so spaces, punctuation, and supported digit formats are handled more safely.

### Clues

Add one clue per line.

Example:

```txt
It was revealed to Prophet Muhammad ﷺ.
It is written in Arabic.
It is recited during prayer.
Its name means The Recitation.
```

Each correct answer is worth 5 points by default. Wrong or skipped answers get 0 points. Each revealed clue reduces the possible score by 1 point, so a correct answer after 2 clues earns 3 points.

## 4. Create A Quiz Event

Go to:

```txt
/admin
```

Use the Create Event form.

Fill:

- Event title
- Quiz set
- Max participants
- Initial status
- Whether to show answers after completion

Recommended status:

- Use `draft` while preparing.
- Switch to `open` when participants can join.
- Switch to `closed` after the event ends.

After creating an event, the platform generates a join code.

Example:

```txt
YASEEN
```

The Surah Yaseen & Luqman Treasure Hunt is already created as an open event:

```txt
Event: Surah Yaseen Quiz Challenge
Join code: YASEEN
Questions: 6
Maximum score: 30
Scoring: correct answer = 5, wrong/skipped = 0, each clue used = -1
```

## 5. Share The Join Link

From the event detail page, use:

- Open join page
- Copy link

Participants can join through:

```txt
/join/EVENTCODE
```

Or from the homepage by entering:

- Event code
- Participant/team name

## 6. Participant Flow

Participants will:

1. Enter the event code.
2. Enter their name or team name.
3. Answer each treasure chest question.
4. Reveal clues if needed.
5. Submit an answer or skip.
6. See their final score and leaderboard.

The play screen supports:

- English keyboard
- Arabic keyboard
- Malayalam keyboard
- Score display
- Clue vault
- Progress path
- Final result page

## 7. Live Monitoring

Open the event detail page from the dashboard.

The event detail page shows:

- Join code
- Event status
- Participant count
- Question count
- Event settings editor
- Leaderboard
- Answer review queue

Use this page during the live quiz to monitor progress, change status, edit event title, change participant limit, and control whether answers are shown after completion.

Visible `Edit` buttons are available from the admin dashboard event list. Question edit buttons are available from `/admin/questions`.

## 8. Manual Answer Review

In the Answer Review section, each submitted answer shows:

- Question
- Participant answer
- Answer language
- Auto result
- Manual review controls
- Points awarded

Manual review options:

- `Correct`
- `Incorrect`
- `Auto`

Use manual review when:

- A participant gave a correct answer not listed in accepted variants.
- A spelling or language variation should be accepted.
- The automatic check marked an answer incorrectly.

When a manual verdict changes, the participant score is recalculated.

## 9. Closing The Event

When the quiz is finished:

1. Open the event detail page.
2. Change status to `closed`.
3. Review pending answers.
4. Confirm leaderboard scores.

Closed events stop new participants from joining.

## 10. Recommended Event Workflow

Use this workflow for a real quiz:

1. Prepare all questions in the Question Bank.
2. Add accepted answers in English, Arabic, and Malayalam where useful.
3. Add 2-4 clues per question.
4. Create the event as `draft`.
5. Open the join page and test with one internal participant.
6. Review the result and scoring.
7. Set event status to `open`.
8. Share the event code or join link with participants.
9. Monitor the leaderboard during the quiz.
10. Review answers manually if needed.
11. Set event status to `closed`.
12. Announce the final leaderboard.

## 11. Best Practices

- Add generous answer variants before the event starts.
- Include Malayalam transliterations and native Malayalam answers if participants may answer in Malayalam.
- Keep questions clear and short.
- Use clues that gradually become easier.
- Avoid changing questions during a live event.
- Do a test run before sharing the event publicly.
- Close the event when the quiz ends.
- Change default admin credentials before production use.

## 12. Production Checklist

Before running a public event:

- Supabase database connected
- Hosting environment variables configured
- Admin password changed
- `AUTH_SECRET` set to a strong random value
- Questions reviewed
- Join link tested
- Mobile layout tested
- Event status set to `open`
