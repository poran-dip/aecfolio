import Image from "next/image";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNavbar />
      <main className="flex-1">
        <Image
          src="/main-building.jpg"
          alt="background"
          fill
          className="fixed inset-0 object-cover brightness-50 blur-sm scale-105 -z-5 pointer-events-none"
        />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,black_100%)] -z-5" />
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
