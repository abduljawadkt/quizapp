import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, KeyRound, Lock, Medal, Radio, Star, Trophy, Users } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { updateEventStatus, updateManualVerdict } from "@/app/actions/admin";
import { AdminTopbar } from "@/components/AdminTopbar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveCorrect } from "@/lib/scoring";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireAdmin();
  const { eventId } = await params;
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      quizSet: { include: { questions: { where: { active: true } } } },
      participants: { orderBy: { createdAt: "asc" } },
      attempts: {
        orderBy: { startedAt: "desc" },
        include: {
          participant: true,
          responses: {
            orderBy: { questionIndex: "asc" },
            include: { question: true },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const leaderboard = event.attempts
    .slice()
    .sort((a, b) => b.score - a.score || a.startedAt.getTime() - b.startedAt.getTime());
  const joinUrl = `/join/${event.joinCode}`;

  return (
    <main className="shell">
      <AdminTopbar title={event.title} />

      <div className="grid">
        <section className="card admin-focus span-4">
          <span className="eyebrow"><KeyRound size={15} /> Event access</span>
          <h2>Event Control</h2>
          <h1>{event.joinCode}</h1>
          <div className="row" style={{ marginBottom: 14 }}>
            <span className={`pill ${event.status}`}>{event.status}</span>
            <span className="pill"><Users size={14} /> {event.participants.length}/{event.maxParticipants}</span>
            <span className="pill"><Star size={14} /> {event.quizSet.questions.length} questions</span>
          </div>
          <div className="row">
            <Link className="button primary" href={joinUrl}><ExternalLink size={16} /> Open join page</Link>
            <CopyButton value={`http://localhost:3001${joinUrl}`} label="Copy link" />
          </div>
          <hr style={{ borderColor: "var(--line)", margin: "18px 0" }} />
          <div className="row">
            {["draft", "open", "closed"].map((status) => (
              <form action={updateEventStatus} key={status}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value={status} />
                <button type="submit" className={event.status === status ? "primary" : ""}>
                  {status === "closed" ? <Lock size={15} /> : <Radio size={15} />}
                  {status}
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="card span-8">
          <div className="spread">
            <h2>Leaderboard</h2>
            <span className="pill open"><Trophy size={14} /> {leaderboard.length} attempts</span>
          </div>
          {leaderboard.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participant</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((attempt, index) => (
                    <tr key={attempt.id}>
                      <td><Medal size={16} /> {index + 1}</td>
                      <td>{attempt.participant.name}</td>
                      <td><span className={`pill ${attempt.status === "completed" ? "open" : ""}`}>{attempt.status}</span></td>
                      <td><strong className="points-value">{attempt.score}</strong></td>
                      <td>{attempt.responses.length}/{event.quizSet.questions.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No attempts yet.</p>
          )}
        </section>

        <section className="card span-12">
          <div className="spread">
            <h2>Answer Review</h2>
            <span className="pill">{event.attempts.reduce((sum, attempt) => sum + attempt.responses.length, 0)} submissions</span>
          </div>
          {event.attempts.length ? event.attempts.map((attempt) => (
            <div className="review-block" key={attempt.id}>
              <div className="spread">
                <div>
                  <h3>{attempt.participant.name}</h3>
                  <div className="muted">Score <span className="points-value">{attempt.score}</span> · {attempt.status}</div>
                </div>
                <Link className="button" href={`/result/${attempt.id}`}>Result</Link>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Language</th>
                      <th>Auto</th>
                      <th>Manual Review</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempt.responses.map((response) => {
                      const correct = effectiveCorrect(response);
                      return (
                        <tr key={response.id}>
                          <td>{response.questionIndex + 1}. {response.question.prompt}</td>
                          <td>{response.skipped ? <em className="muted">Skipped</em> : response.answerText}</td>
                          <td>{response.answerLanguage ? <span className="pill">{response.answerLanguage.toUpperCase()}</span> : <span className="muted">-</span>}</td>
                          <td className={response.autoCorrect ? "success" : "danger"}>{response.skipped ? "Skipped" : response.autoCorrect ? "Correct" : "Incorrect"}</td>
                          <td>
                            {response.skipped ? (
                              <span className="muted">No review</span>
                            ) : (
                              <div className="row">
                                <form action={updateManualVerdict}>
                                  <input type="hidden" name="responseId" value={response.id} />
                                  <input type="hidden" name="verdict" value="true" />
                                  <button type="submit" className={response.manualCorrect === true ? "primary" : ""}>Correct</button>
                                </form>
                                <form action={updateManualVerdict}>
                                  <input type="hidden" name="responseId" value={response.id} />
                                  <input type="hidden" name="verdict" value="false" />
                                  <button type="submit" className={response.manualCorrect === false ? "danger" : ""}>Incorrect</button>
                                </form>
                                <form action={updateManualVerdict}>
                                  <input type="hidden" name="responseId" value={response.id} />
                                  <input type="hidden" name="verdict" value="clear" />
                                  <button type="submit">Auto</button>
                                </form>
                              </div>
                            )}
                          </td>
                          <td className={correct ? "points-cell" : "danger"}>{response.pointsAwarded}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )) : <p className="muted">Submissions will appear here as participants play.</p>}
        </section>
      </div>
    </main>
  );
}
