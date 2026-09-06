import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Home, KeyRound, Lock, Sparkles, Users } from "lucide-react";
import { joinEvent } from "@/app/actions/play";
import { db } from "@/lib/db";

export default async function JoinCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const event = await db.event.findUnique({
    where: { joinCode: code.toUpperCase() },
    include: { quizSet: { include: { questions: { where: { active: true } } } }, _count: { select: { participants: true } } },
  });

  if (!event) notFound();
  const isOpen = event.status === "open" && event._count.participants < event.maxParticipants;

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <strong>{event.title}</strong>
          <span>{event.quizSet.title} · {event.quizSet.questions.length} chests</span>
        </div>
        <div className="nav"><Link href="/"><Home size={16} /> Home</Link></div>
      </div>

      <section className="card hero-card quiz-wrap">
        <span className="eyebrow"><Sparkles size={15} /> Ready to begin</span>
        <h1>{event.joinCode}</h1>
        <div className="gem-cluster" aria-hidden="true">
          <span className="gem" />
          <span className="gem" />
          <span className="gem" />
          <span className="gem" />
          <span className="gem" />
          <span className="gem" />
        </div>
        <div className="row" style={{ marginBottom: 18 }}>
          <span className="pill open"><KeyRound size={14} /> Event code</span>
          <span className="pill"><Users size={14} /> {event._count.participants}/{event.maxParticipants} explorers</span>
        </div>
        {isOpen ? (
          <form action={joinEvent}>
            <input type="hidden" name="code" value={event.joinCode} />
            <div className="field">
              <label htmlFor="name">Explorer name</label>
              <input id="name" name="name" placeholder="Participant or team name" autoComplete="off" required />
            </div>
            <button className="primary" type="submit">Begin treasure hunt <ArrowRight size={17} /></button>
          </form>
        ) : (
          <p className="notice"><Lock size={16} /> This event is not open for new participants.</p>
        )}
      </section>
    </main>
  );
}
