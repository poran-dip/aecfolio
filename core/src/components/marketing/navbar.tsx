import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@/components/auth-components";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const MarketingNavbar = async () => {
  const session = await auth();

  return (
    <header className="fixed top-0 w-full z-30 flex items-center justify-between px-3 sm:px-6 h-16 bg-background/60 backdrop-blur-sm shadow-sm">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="AEC logo"
          width={28}
          height={28}
          className="w-7 h-7"
        />
        <span className="text-lg font-bold text-foreground/80 tracking-wide">
          AECFolio
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {session ? (
          <Link href="/dashboard">
            <Button className="cursor-pointer">Open Dashboard</Button>
          </Link>
        ) : (
          <SignIn />
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
