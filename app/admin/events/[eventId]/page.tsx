import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileQuestion, KeyRound, Lock, Medal, Radio, Save, Star, Trash2, Trophy, Users } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { deleteEvent, updateEventSettings, updateEventStatus, updateManualVerdict } from "@/app/actions/admin";
import { AdminTopbar } from "@/components/AdminTopbar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveCorrect } from "@/lib/scoring";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const { eventId } = await params;
  const query = (await searchParams) ?? {};
  const [event, quizSets] = await Promise.all([
    db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        quizSetId: true,
        joinCode: true,
        status: true,
        maxParticipants: true,
        showAnswers: true,
        quizSet: {
          select: {
            title: true,
            _count: { select: { questions: { where: { active: true } } } },
          },
        },
        attempts: {
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            score: true,
            startedAt: true,
            participant: { select: { name: true } },
            responses: {
              orderBy: { questionIndex: "asc" },
              select: {
                id: true,
                questionIndex: true,
                answerText: true,
                answerLanguage: true,
                skipped: true,
                autoCorrect: true,
                manualCorrect: true,
                pointsAwarded: true,
                question: { select: { prompt: true } },
              },
            },
          },
        },
        _count: { select: { participants: true } },
      },
    }),
    db.quizSet.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

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
            <span className="pill"><Users size={14} /> {event._count.participants}/{event.maxParticipants}</span>
            <span className="pill"><Star size={14} /> {event.quizSet._count.questions} questions</span>
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
                <input type="hidden" name="returnTo" value={`/admin/events/${event.id}`} />
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
            <h2>Edit Event</h2>
            <Link className="button" href="/admin/questions"><FileQuestion size={16} /> Edit questions</Link>
          </div>
          {query.updated === "settings" ? <p className="notice">Event settings saved.</p> : null}
          {query.updated === "status" ? <p className="notice">Event status updated.</p> : null}
          {query.error === "delete" ? <p className="notice">Delete failed. Type the exact event code to confirm.</p> : null}
          <form action={updateEventSettings}>
            <input type="hidden" name="eventId" value={event.id} />
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="title">Event title</label>
                <input id="title" name="title" defaultValue={event.title} required />
              </div>
              <div className="field" style={{ width: 170 }}>
                <label htmlFor="maxParticipants">Max participants</label>
                <input id="maxParticipants" name="maxParticipants" type="number" min="1" defaultValue={event.maxParticipants} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="quizSetId">Quiz set</label>
                {event.attempts.length ? <input type="hidden" name="quizSetId" value={event.quizSetId} /> : null}
                <select id="quizSetId" name="quizSetId" defaultValue={event.quizSetId} disabled={event.attempts.length > 0}>
                  {quizSets.map((set) => <option value={set.id} key={set.id}>{set.title}</option>)}
                </select>
                {event.attempts.length ? <span className="muted">Quiz set is locked after participants start playing.</span> : null}
              </div>
              <div className="field" style={{ width: 170 }}>
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={event.status}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <label className="row" style={{ marginBottom: 14 }}>
              <input name="showAnswers" type="checkbox" defaultChecked={event.showAnswers} style={{ width: "auto" }} />
              <span className="muted">Show answer sheet after completion</span>
            </label>
            <button type="submit" className="primary"><Save size={16} /> Save event</button>
          </form>
        </section>

        <section className="card span-12 danger-zone" id="delete-event">
          <div className="spread">
            <div>
              <h2>Delete Event</h2>
              <p className="muted">This removes the event room, participant entries, attempts, submitted answers, and leaderboard history. The question bank stays available.</p>
            </div>
            <span className="pill closed">{event.joinCode}</span>
          </div>
          <form action={deleteEvent}>
            <input type="hidden" name="eventId" value={event.id} />
            <div className="row">
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="confirmCode">Type event code to confirm</label>
                <input id="confirmCode" name="confirmCode" placeholder={event.joinCode} autoComplete="off" required />
              </div>
              <button className="danger" type="submit"><Trash2 size={16} /> Delete event</button>
            </div>
          </form>
        </section>

        <section className="card span-12">
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
                      <td>{attempt.responses.length}/{event.quizSet._count.questions}</td>
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
