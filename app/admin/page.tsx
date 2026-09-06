import Link from "next/link";
import { CalendarPlus, CheckCircle2, ExternalLink, FileQuestion, Lock, Pencil, Radio, Users } from "lucide-react";
import { createEvent, updateEventStatus } from "@/app/actions/admin";
import { AdminTopbar } from "@/components/AdminTopbar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminDashboard({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const [events, quizSets, counts] = await Promise.all([
    db.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        joinCode: true,
        status: true,
        maxParticipants: true,
        quizSet: { select: { title: true } },
        _count: { select: { participants: true, attempts: true } },
      },
    }),
    db.quizSet.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, title: true } }),
    db.$transaction([
      db.question.count(),
      db.participant.count(),
      db.attempt.count({ where: { status: "completed" } }),
    ]),
  ]);

  return (
    <main className="shell">
      <AdminTopbar title="Admin Dashboard" />

      <div className="grid">
        <section className="card metric span-3">
          <span><FileQuestion size={17} /> Questions</span>
          <strong>{counts[0]}</strong>
        </section>
        <section className="card metric span-3">
          <span><Users size={17} /> Participants</span>
          <strong>{counts[1]}</strong>
        </section>
        <section className="card metric span-3">
          <span><CheckCircle2 size={17} /> Completed</span>
          <strong>{counts[2]}</strong>
        </section>
        <section className="card metric span-3">
          <span><Radio size={17} /> Live Events</span>
          <strong>{events.filter((event) => event.status === "open").length}</strong>
        </section>

        <section className="card admin-focus span-4">
          <span className="eyebrow"><CalendarPlus size={15} /> New round</span>
          <h2>Create Event</h2>
          <p className="muted">Spin up a new quest room with its own join code, leaderboard, and review queue.</p>
          <form action={createEvent}>
            <div className="field">
              <label htmlFor="title">Event title</label>
              <input id="title" name="title" placeholder="Friday quiz round" required />
            </div>
            <div className="field">
              <label htmlFor="quizSetId">Quiz set</label>
              <select id="quizSetId" name="quizSetId" required>
                {quizSets.map((set) => <option value={set.id} key={set.id}>{set.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="maxParticipants">Max participants</label>
              <input id="maxParticipants" name="maxParticipants" type="number" min="1" defaultValue="50" />
            </div>
            <div className="field">
              <label htmlFor="status">Initial status</label>
              <select id="status" name="status" defaultValue="open">
                <option value="open">Open for joining</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <label className="row" style={{ marginBottom: 14 }}>
              <input name="showAnswers" type="checkbox" defaultChecked style={{ width: "auto" }} />
              <span className="muted">Show answer sheet after completion</span>
            </label>
            <button className="primary" type="submit"><CalendarPlus size={16} /> Create event</button>
          </form>
        </section>

        <section className="card span-8">
          <div className="spread">
            <h2>Events</h2>
            <Link className="button" href="/admin/questions"><FileQuestion size={16} /> Manage questions</Link>
          </div>
          {params.updated === "status" ? <p className="notice">Event status updated.</p> : null}
          {events.length ? (
            <div className="event-list">
              {events.map((event) => (
                <div className="event-tile" key={event.id}>
                  <div>
                    <Link href={`/admin/events/${event.id}`}><strong>{event.title}</strong></Link>
                    <div className="muted" style={{ marginTop: 4 }}>{event.quizSet.title}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <span className="pill gem-pill">{event.joinCode}</span>
                      <span className={`pill ${event.status}`}>{event.status}</span>
                      <span className="pill"><Users size={14} /> {event._count.participants}/{event.maxParticipants}</span>
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <Link className="button" href={`/join/${event.joinCode}`}><ExternalLink size={16} /> Join</Link>
                    <Link className="button success" href={`/admin/events/${event.id}`}><Pencil size={16} /> Edit</Link>
                    {["draft", "open", "closed"].map((status) => (
                      <form action={updateEventStatus} key={status}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value={status} />
                        <input type="hidden" name="returnTo" value="/admin" />
                        <button type="submit" className={event.status === status ? "primary" : ""} disabled={event.status === status}>
                          {status === "closed" ? <Lock size={15} /> : <Radio size={15} />}
                          {status}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No events yet.</p>
          )}
          <div className="reward-strip">
            <div className="reward-item">
              <span>Round setup</span>
              <strong>Fast</strong>
            </div>
            <div className="reward-item">
              <span>Status</span>
              <strong>Live</strong>
            </div>
            <div className="reward-item">
              <span>Review</span>
              <strong>Manual</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
