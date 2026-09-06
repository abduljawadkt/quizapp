import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, Medal, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { effectiveCorrect } from "@/lib/scoring";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      participant: true,
      event: {
        include: {
          attempts: { include: { participant: true }, where: { status: "completed" } },
          quizSet: true,
        },
      },
      responses: {
        orderBy: { questionIndex: "asc" },
        include: { question: true },
      },
    },
  });

  if (!attempt) notFound();
  const total = attempt.responses.reduce((sum, response) => sum + response.question.points, 0);
  const pct = total ? Math.round((attempt.score / total) * 100) : 0;
  const leaderboard = attempt.event.attempts.slice().sort((a, b) => b.score - a.score);

  return (
    <main className="shell">
      <div className="quiz-wrap">
        <section className="card hero-card" style={{ textAlign: "center" }}>
          <span className="eyebrow"><Sparkles size={15} /> Final treasure</span>
          <h1 style={{ maxWidth: "none" }}>{attempt.participant.name}</h1>
          <p className="muted">{attempt.event.title}</p>
          <div className="gem-cluster" aria-hidden="true" style={{ marginInline: "auto" }}>
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
          </div>
          <div className="result-score" style={{ "--pct": `${pct}%` } as React.CSSProperties}>
            <div className="result-score-inner">{attempt.score}/{total}<br />points</div>
          </div>
          <h2>{pct}% complete</h2>
          <div className="reward-strip">
            <div className="reward-item">
              <span>Answered</span>
              <strong>{attempt.responses.length}</strong>
            </div>
            <div className="reward-item">
              <span>Correct</span>
              <strong>{attempt.responses.filter(effectiveCorrect).length}</strong>
            </div>
            <div className="reward-item points">
              <span>Rank</span>
              <strong>{leaderboard.findIndex((row) => row.id === attempt.id) + 1 || "-"}</strong>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link className="button primary" href={`/join/${attempt.event.joinCode}`}><RotateCcw size={16} /> Next participant</Link>
            <Link className="button" href="/"><Home size={16} /> Home</Link>
          </div>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="spread">
            <h2>Leaderboard</h2>
            <span className="pill open"><Trophy size={14} /> {leaderboard.length} completed</span>
          </div>
          {leaderboard.length ? (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {leaderboard.map((row, index) => (
                    <tr key={row.id}>
                      <td><Medal size={16} /> {index + 1}</td>
                      <td>{row.participant.name}</td>
                      <td><strong className="points-value">{row.score}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">This is the first completed attempt.</p>}
        </section>

        {attempt.event.showAnswers ? (
          <section className="card" style={{ marginTop: 16 }}>
            <h2>Answer Sheet</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Your answer</th>
                    <th>Correct answer</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {attempt.responses.map((response) => {
                    const correct = effectiveCorrect(response);
                    const correctAnswers = [
                      response.question.correctDisplayEn,
                      response.question.correctDisplayAr,
                      response.question.correctDisplayMl,
                    ].filter(Boolean).join(" | ");
                    return (
                      <tr key={response.id}>
                        <td>{response.questionIndex + 1}. {response.question.prompt}</td>
                        <td className={correct ? "success" : "danger"}>{response.skipped ? "Skipped" : response.answerText}</td>
                        <td>{correctAnswers}</td>
                        <td className="points-cell">{response.pointsAwarded}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
