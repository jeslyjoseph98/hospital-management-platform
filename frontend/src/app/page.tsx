"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function HomePage() {
  const { token, patient } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="card mx-auto max-w-xl px-8 py-12">
        <p className="mb-3 text-5xl">🩺</p>
        <h1 className="mb-3 text-3xl font-extrabold text-slate-900">
          {token ? `Welcome back, ${patient?.name?.split(" ")[0] ?? "there"}!` : "Book your doctor visit in minutes"}
        </h1>
        <p className="mb-8 text-slate-600">
          Pick a department, choose a doctor, grab an available date, and get an instant token number
          with an estimated reporting time.
        </p>
        {token ? (
          <Link href="/book" className="btn-primary inline-block px-6 py-3 text-base">
            Book an appointment →
          </Link>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Get started
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              I already have an account
            </Link>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureCard emoji="🏢" title="Pick a department" text="Cardiology, Orthopaedics, Pediatrics & more" />
        <FeatureCard emoji="📅" title="Pick a date" text="See live availability for the next 7 days" />
        <FeatureCard emoji="🎟️" title="Get your token" text="Instant token number + reporting time" />
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="card px-4 py-5 text-center">
      <p className="mb-2 text-2xl">{emoji}</p>
      <p className="mb-1 font-bold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
