"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { token, patient, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-violet-100/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="text-2xl">🏥</span>
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            HMS Booking
          </span>
        </Link>

        {token ? (
          <nav className="flex items-center gap-3">
            <Link href="/book" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-900 sm:block">
              Book Appointment
            </Link>
            <Link
              href="/appointments"
              className="hidden text-sm font-semibold text-violet-700 hover:text-violet-900 sm:block"
            >
              My Appointments
            </Link>
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{patient?.name}</p>
              <p className="text-xs text-slate-500">{patient?.patientCode}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary px-4 py-1.5 text-sm">
              Login
            </Link>
            <Link href="/register" className="btn-primary px-4 py-1.5 text-sm">
              Register
            </Link>
          </nav>
        )}
      </div>
      {token && (
        <div className="flex gap-4 border-t border-violet-100/60 px-4 py-2 sm:hidden">
          <Link href="/book" className="text-sm font-semibold text-violet-700">
            Book
          </Link>
          <Link href="/appointments" className="text-sm font-semibold text-violet-700">
            Appointments
          </Link>
        </div>
      )}
    </header>
  );
}
