"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/** Rendered only inside admin/layout.tsx, so a user is always present by the time this mounts. */
export function AdminNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-indigo-900/10 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/admin/doctors" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
          <span className="text-2xl">🛠️</span>
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            HMS Admin
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/admin/doctors" className="text-sm font-semibold text-slate-200 hover:text-white">
            Doctors
          </Link>
          <Link href="/admin/departments" className="text-sm font-semibold text-slate-200 hover:text-white">
            Departments
          </Link>
          <Link href="/admin/bookings" className="text-sm font-semibold text-slate-200 hover:text-white">
            Bookings
          </Link>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-xl border border-slate-600 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
