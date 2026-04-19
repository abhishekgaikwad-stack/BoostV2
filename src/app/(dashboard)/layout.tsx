import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white lg:pl-[120px]">
      <SiteHeader />
      <main className="flex flex-col gap-[calc(var(--spacing)*18)] px-[calc(var(--spacing)*28)] pb-[calc(var(--spacing)*36)] pt-[calc(var(--spacing)*12)]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
