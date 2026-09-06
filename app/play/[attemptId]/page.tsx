import { notFound } from "next/navigation";
import { ArrowRight, Eye, Flag, Gem, Lightbulb, SkipForward, Sparkles, Trophy } from "lucide-react";
import { revealClue, skipQuestion, submitAnswer } from "@/app/actions/play";
import { QuizKeyboard } from "@/components/QuizKeyboard";
import { db } from "@/lib/db";

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { attemptId } = await params;
  const qp = (await searchParams) ?? {};
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      status: true,
      currentIndex: true,
      score: true,
      participant: { select: { name: true } },
      event: {
        select: {
          title: true,
          quizSet: {
            select: {
              questions: {
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  prompt: true,
                  points: true,
                  clues: {
                    orderBy: { sortOrder: "asc" },
                    select: { id: true, text: true, penalty: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) notFound();
  if (attempt.status === "completed") {
    return (
      <main className="shell">
        <section className="card quiz-wrap">
          <span className="eyebrow"><Trophy size={15} /> Completed</span>
          <h1>Treasure found</h1>
          <p className="muted">Your final score is ready.</p>
          <a className="button primary" href={`/result/${attempt.id}`}>View result <ArrowRight size={17} /></a>
        </section>
      </main>
    );
  }

  const questions = attempt.event.quizSet.questions;
  const question = questions[attempt.currentIndex];
  if (!question) notFound();
  const reveals = await db.clueReveal.findMany({
    where: { attemptId: attempt.id, questionId: question.id },
    select: { id: true, clue: { select: { text: true } } },
    orderBy: { revealedAt: "asc" },
  });
  const nextClueAvailable = reveals.length < question.clues.length;
  const progressPct = Math.round((attempt.currentIndex / questions.length) * 100);
  const cluePenalty = question.clues[0]?.penalty ?? 1;
  const possibleNow = Math.max(0, question.points - reveals.length * cluePenalty);

  return (
    <main className="shell">
      <div className="quiz-wrap wide">
        <div className="play-hud">
          <div className="brand">
            <strong>{attempt.event.title}</strong>
            <span>{attempt.participant.name} · Chest {attempt.currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="play-hud-stats">
            <span className="pill"><Flag size={14} /> {questions.length - attempt.currentIndex - 1} left</span>
            <span className="score-chip"><Gem size={16} /> {attempt.score} pts</span>
          </div>
        </div>

        <section className="card quest-card">
          {qp.earned ? (
            <p className="notice">
              Previous chest: {qp.skipped === "1" ? "skipped" : qp.correct === "1" ? "correct" : "incorrect"} · <span className="points-value">+{qp.earned} points</span>
            </p>
          ) : null}
          {qp.error ? <p className="notice">Enter an answer or skip this chest.</p> : null}

          <div className="path">
            {questions.map((_, index) => (
              <div className={`node ${index < attempt.currentIndex ? "done" : index === attempt.currentIndex ? "current" : ""}`} key={index}>
                {index < attempt.currentIndex ? "✓" : index + 1}
              </div>
            ))}
          </div>
          <div className="xp-track" aria-label={`${progressPct}% completed`}>
            <div className="xp-fill" style={{ "--xp": `${progressPct}%` } as React.CSSProperties} />
          </div>

          <div className="quest-head">
            <div>
              <span className="eyebrow"><Sparkles size={15} /> Chest {attempt.currentIndex + 1}</span>
              <h1 style={{ maxWidth: "none" }}>{question.prompt}</h1>
              <p className="muted">Worth <span className="points-value">{question.points} points</span> · clue cost {cluePenalty} {cluePenalty === 1 ? "point" : "points"}</p>
            </div>
            <span className="pill open"><Trophy size={14} /> Level {attempt.currentIndex + 1}</span>
          </div>

          <div className="reward-strip">
            <div className="reward-item points">
              <span>Chest value</span>
              <strong>{question.points}</strong>
            </div>
            <div className="reward-item">
              <span>Clues opened</span>
              <strong>{reveals.length}</strong>
            </div>
            <div className="reward-item points">
              <span>Possible now</span>
              <strong>{possibleNow}</strong>
            </div>
          </div>

          <div className="play-grid">
            <div className="play-panel answer-panel">
              <h3>Clue Vault</h3>
              {reveals.length ? reveals.map((reveal, index) => (
                <div className="clue" key={reveal.id}>
                  <strong><Lightbulb size={15} /> Clue {index + 1}:</strong> {reveal.clue.text}
                </div>
              )) : <p className="muted">No clues opened yet. Keep full points or unlock a hint.</p>}

              <form action={revealClue} style={{ margin: "12px 0 0" }}>
                <input type="hidden" name="attemptId" value={attempt.id} />
                <button type="submit" disabled={!nextClueAvailable}>
                  <Eye size={16} />
                  {nextClueAvailable ? `Reveal clue ${reveals.length + 1}` : "All clues revealed"}
                </button>
              </form>
            </div>

            <div className="play-panel">
              <form action={submitAnswer}>
                <input type="hidden" name="attemptId" value={attempt.id} />
                <div className="field">
                  <label htmlFor="answerText">Your answer</label>
                  <input id="answerText" name="answerText" className="answer" autoComplete="off" />
                </div>
                <QuizKeyboard inputId="answerText" />
                <div className="row" style={{ marginTop: 16 }}>
                  <button className="primary" type="submit">Open chest <Gem size={17} /></button>
                </div>
              </form>

              <form action={skipQuestion} style={{ marginTop: 10 }}>
                <input type="hidden" name="attemptId" value={attempt.id} />
                <button type="submit" className="ghost"><SkipForward size={16} /> Skip chest</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
