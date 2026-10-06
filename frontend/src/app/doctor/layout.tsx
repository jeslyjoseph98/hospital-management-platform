import { RequireDoctor } from "@/components/RequireDoctor";
import { DoctorNavbar } from "@/components/DoctorNavbar";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireDoctor>
      <div className="flex min-h-full flex-1 flex-col bg-slate-50">
        <DoctorNavbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">{children}</main>
      </div>
    </RequireDoctor>
  );
}
