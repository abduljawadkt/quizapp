import Link from "next/link";
import { ArrowRight, Brain, KeyRound, ShieldCheck, Sparkles, Timer, Trophy, Users, Zap } from "lucide-react";
import { joinEvent } from "@/app/actions/play";
import { db } from "@/lib/db";

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) ?? {};
  const events = await db.event.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { quizSet: true, _count: { select: { participants: true } } },
  });
  const code = params.code?.toUpperCase() ?? events[0]?.joinCode ?? "";
  const totalParticipants = events.reduce((sum, event) => sum + event._count.participants, 0);

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <strong>IGM Treasure Hunt Quiz</strong>
          <span>Interactive quiz events with clues, scoring, and admin review</span>
        </div>
        <div className="nav">
          <Link href="/admin"><ShieldCheck size={16} /> Admin</Link>
        </div>
      </div>

      <div className="grid hero home-hero">
        <section className="card hero-card play-intro span-7">
          <span className="stage-badge"><Zap size={18} /></span>
          <span className="eyebrow"><Sparkles size={15} /> Live treasure hunt</span>
          <h1>Join the expedition</h1>
          <p className="lead">Enter an event code, choose your explorer name, and unlock each chest with answers and clues.</p>
          <div className="quiz-stack" aria-hidden="true">
            <span><Brain size={23} /></span>
            <span><Timer size={23} /></span>
            <span><Trophy size={23} /></span>
          </div>
          {params.error ? <p className="notice">Could not join. Check the event code, event status, or participant limit.</p> : null}
          <form action={joinEvent}>
            <div className="field">
              <label htmlFor="code">Event code</label>
              <input id="code" name="code" defaultValue={code} placeholder="Example: YASEEN" />
            </div>
            <div className="field">
              <label htmlFor="name">Explorer name</label>
              <input id="name" name="name" placeholder="Enter participant or team name" autoComplete="off" />
            </div>
            <button className="primary" type="submit">Start quiz <ArrowRight size={17} /></button>
          </form>
        </section>

        <aside className="card live-panel span-5">
          <div className="panel-header">
            <h2>Open Events</h2>
            <span className="pill open"><Trophy size={14} /> {events.length} live</span>
          </div>
          {events.length ? (
            <div className="event-list">
              {events.map((event) => (
                <Link href={`/join/${event.joinCode}`} className="event-tile" key={event.id}>
                  <span>
                    <strong>{event.title}</strong>
                    <span className="muted" style={{ display: "block", marginTop: 4 }}>{event.quizSet.title}</span>
                  </span>
                  <span className="row" style={{ justifyContent: "flex-end" }}>
                    <span className="pill"><KeyRound size={14} /> {event.joinCode}</span>
                    <span className="pill"><Users size={14} /> {event._count.participants}/{event.maxParticipants}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No open events yet. Login as admin and open one.</p>
          )}
          <div className="reward-strip">
            <div className="reward-item points">
              <span>Clues</span>
              <strong>Smart</strong>
            </div>
            <div className="reward-item">
              <span>Scoring</span>
              <strong>Live</strong>
            </div>
            <div className="reward-item">
              <span>Review</span>
              <strong>Admin</strong>
            </div>
          </div>
          <div className="micro-feed" aria-label="Live quiz status">
            <div>{events.length} live rooms</div>
            <div>{totalParticipants} explorers inside</div>
            <div>{events[0]?.quizSet.title ?? "Quiz set"} ready</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
