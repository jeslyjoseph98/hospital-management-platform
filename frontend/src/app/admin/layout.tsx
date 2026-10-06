import { RequireAdmin } from "@/components/RequireAdmin";
import { AdminNavbar } from "@/components/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex min-h-full flex-1 flex-col bg-slate-50">
        <AdminNavbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">{children}</main>
      </div>
    </RequireAdmin>
  );
}
