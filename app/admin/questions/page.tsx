import { Archive, CheckCircle2, FileQuestion, ListPlus, PlusCircle } from "lucide-react";
import { createQuestion, toggleQuestion } from "@/app/actions/admin";
import { AdminTopbar } from "@/components/AdminTopbar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function QuestionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const [quizSets, questions] = await Promise.all([
    db.quizSet.findMany({ orderBy: { createdAt: "asc" } }),
    db.question.findMany({
      orderBy: [{ quizSetId: "asc" }, { sortOrder: "asc" }],
      include: { quizSet: true, answerVariants: true, clues: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return (
    <main className="shell">
      <AdminTopbar title="Question Bank" />

      <div className="grid">
        <section className="card admin-focus span-5">
          <span className="eyebrow"><ListPlus size={15} /> Build the quiz</span>
          <h2>Add Question</h2>
          <p className="muted">Add accepted variants generously. The server normalizes answers and allows small Latin typos.</p>
          {params.created ? <p className="notice">Question added.</p> : null}
          {params.error ? <p className="notice">Could not save question. Check all required fields.</p> : null}
          <form action={createQuestion}>
            <div className="field">
              <label htmlFor="quizSetId">Quiz set</label>
              <select id="quizSetId" name="quizSetId">
                {quizSets.map((set) => <option value={set.id} key={set.id}>{set.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="prompt">Question</label>
              <textarea id="prompt" name="prompt" required />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayEn">Display answer English</label>
              <input id="correctDisplayEn" name="correctDisplayEn" required />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayAr">Display answer Arabic</label>
              <input id="correctDisplayAr" name="correctDisplayAr" />
            </div>
            <div className="field">
              <label htmlFor="correctDisplayMl">Display answer Malayalam</label>
              <input id="correctDisplayMl" name="correctDisplayMl" />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="category">Category</label>
                <input id="category" name="category" placeholder="Islamic Knowledge" />
              </div>
              <div className="field" style={{ width: 130 }}>
                <label htmlFor="points">Points</label>
                <input id="points" name="points" type="number" min="1" defaultValue="5" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="variants">Accepted answers</label>
              <textarea id="variants" name="variants" placeholder={"One per line, or comma-separated\nquran\nkoran\nالقرآن\nഖുര്‍ആൻ"} required />
            </div>
            <div className="field">
              <label htmlFor="clues">Clues</label>
              <textarea id="clues" name="clues" placeholder={"One clue per line\nFirst clue\nSecond clue"} required />
            </div>
            <button className="primary" type="submit"><PlusCircle size={16} /> Add question</button>
          </form>
        </section>

        <section className="card span-7">
          <div className="spread">
            <h2>Questions</h2>
            <span className="pill"><FileQuestion size={14} /> {questions.length} total</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Answers</th>
                  <th>Clues</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td>
                      <strong>{question.prompt}</strong>
                      <div className="muted">
                        {question.quizSet.title} · <span className="points-value">{question.points} pts</span>
                        {question.correctDisplayMl ? ` · ML: ${question.correctDisplayMl}` : ""}
                      </div>
                    </td>
                    <td>{question.answerVariants.map((variant) => `${variant.value} (${variant.language.toUpperCase()})`).join(", ")}</td>
                    <td><span className="pill">{question.clues.length} clues</span></td>
                    <td>
                      <form action={toggleQuestion}>
                        <input type="hidden" name="id" value={question.id} />
                        <input type="hidden" name="active" value={String(question.active)} />
                        <button type="submit" className={question.active ? "primary" : "ghost"}>
                          {question.active ? <CheckCircle2 size={15} /> : <Archive size={15} />}
                          {question.active ? "Active" : "Archived"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="reward-strip">
            <div className="reward-item">
              <span>Active</span>
              <strong>{questions.filter((question) => question.active).length}</strong>
            </div>
            <div className="reward-item">
              <span>Clues</span>
              <strong>{questions.reduce((sum, question) => sum + question.clues.length, 0)}</strong>
            </div>
            <div className="reward-item">
              <span>Variants</span>
              <strong>{questions.reduce((sum, question) => sum + question.answerVariants.length, 0)}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
