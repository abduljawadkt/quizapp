import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateQuestion } from "@/app/actions/admin";
import { AdminTopbar } from "@/components/AdminTopbar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ questionId: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const { questionId } = await params;
  const query = (await searchParams) ?? {};
  const [question, quizSets] = await Promise.all([
    db.question.findUnique({
      where: { id: questionId },
      include: {
        answerVariants: { orderBy: { createdAt: "asc" } },
        clues: { orderBy: { sortOrder: "asc" } },
        quizSet: true,
      },
    }),
    db.quizSet.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!question) notFound();

  return (
    <main className="shell">
      <AdminTopbar title="Edit Question" />

      <div className="grid">
        <section className="card admin-focus span-5">
          <span className="eyebrow">Question editor</span>
          <h2>Update Quiz Question</h2>
          <p className="muted">Changes affect future play immediately. Avoid editing live questions after participants have started unless you are correcting a typo or accepted answer.</p>
          {query.updated ? <p className="notice">Question updated.</p> : null}
          {query.error ? <p className="notice">Could not save question. Check all required fields.</p> : null}
          <Link className="button" href="/admin/questions"><ArrowLeft size={16} /> Back to questions</Link>
        </section>

        <section className="card span-7">
          <form action={updateQuestion}>
            <input type="hidden" name="id" value={question.id} />
            <div className="field">
              <label htmlFor="quizSetId">Quiz set</label>
              <select id="quizSetId" name="quizSetId" defaultValue={question.quizSetId}>
                {quizSets.map((set) => <option value={set.id} key={set.id}>{set.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="prompt">Question</label>
              <textarea id="prompt" name="prompt" defaultValue={question.prompt} required />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayEn">Display answer English</label>
              <input id="correctDisplayEn" name="correctDisplayEn" defaultValue={question.correctDisplayEn} required />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayAr">Display answer Arabic</label>
              <input id="correctDisplayAr" name="correctDisplayAr" defaultValue={question.correctDisplayAr ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayMl">Display answer Malayalam</label>
              <input id="correctDisplayMl" name="correctDisplayMl" defaultValue={question.correctDisplayMl ?? ""} />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="category">Category</label>
                <input id="category" name="category" defaultValue={question.category ?? ""} />
              </div>
              <div className="field" style={{ width: 130 }}>
                <label htmlFor="points">Points</label>
                <input id="points" name="points" type="number" min="1" defaultValue={question.points} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="difficulty">Difficulty</label>
              <select id="difficulty" name="difficulty" defaultValue={question.difficulty}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="variants">Accepted answers</label>
              <textarea
                id="variants"
                name="variants"
                defaultValue={question.answerVariants.map((variant) => variant.value).join("\n")}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="clues">Clues</label>
              <textarea
                id="clues"
                name="clues"
                defaultValue={question.clues.map((clue) => clue.text).join("\n")}
                required
              />
            </div>
            <button className="primary" type="submit"><Save size={16} /> Save question</button>
          </form>
        </section>
      </div>
    </main>
  );
}
