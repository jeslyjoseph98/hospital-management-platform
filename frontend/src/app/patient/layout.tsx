import { RequirePatient } from "@/components/RequirePatient";
import { Navbar } from "@/components/Navbar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePatient>
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">{children}</main>
    </RequirePatient>
  );
}
