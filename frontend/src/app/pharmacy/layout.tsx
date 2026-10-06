import { RequirePharmacist } from "@/components/RequirePharmacist";
import { PharmacyNavbar } from "@/components/PharmacyNavbar";

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePharmacist>
      <div className="flex min-h-full flex-1 flex-col bg-slate-50">
        <PharmacyNavbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">{children}</main>
      </div>
    </RequirePharmacist>
  );
}
