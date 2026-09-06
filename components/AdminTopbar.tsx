import Link from "next/link";
import { Gauge, LogOut, PlusCircle } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin";

export function AdminTopbar({ title = "Admin" }: { title?: string }) {
  return (
    <div className="topbar">
      <div className="brand">
        <strong>{title}</strong>
        <span>IGM Treasure Hunt control room</span>
      </div>
      <div className="nav">
        <Link href="/admin"><Gauge size={16} /> Dashboard</Link>
        <Link href="/admin/questions"><PlusCircle size={16} /> Questions</Link>
        <form action={logoutAdmin}>
          <button type="submit"><LogOut size={16} /> Logout</button>
        </form>
      </div>
    </div>
  );
}
