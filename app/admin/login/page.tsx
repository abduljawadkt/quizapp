import { LockKeyhole, LogIn } from "lucide-react";
import { loginAdmin } from "@/app/actions/admin";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) ?? {};

  return (
    <main className="shell">
      <div className="quiz-wrap">
        <div className="card hero-card admin-focus">
          <div className="brand" style={{ marginBottom: 18 }}>
            <span className="eyebrow"><LockKeyhole size={15} /> Secure admin</span>
            <strong>Admin Login</strong>
            <span>Use the seeded admin credentials from .env for local development.</span>
          </div>
          <div className="gem-cluster" aria-hidden="true">
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
            <span className="gem" />
          </div>
          {params.error ? <p className="notice">Invalid admin credentials.</p> : null}
          <form action={loginAdmin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue="admin@igm.local" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" />
            </div>
            <button className="primary" type="submit">Enter admin <LogIn size={17} /></button>
          </form>
        </div>
      </div>
    </main>
  );
}
