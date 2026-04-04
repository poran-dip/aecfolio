'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function MarketingNavbar() {
  const signedIn = false;
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
  }

  return (
    <header className="fixed top-0 w-full z-30 flex items-center justify-between px-3 sm:px-6 h-16 bg-background/60 backdrop-blur-sm shadow-sm">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="AEC logo" width={28} height={28} className="w-7 h-7" />
        <span className="text-lg font-bold text-foreground/80 tracking-wide">AECFolio</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/dashboard">
          <Button className="cursor-pointer">
            {signedIn ? "Dashboard" : "Sign In"}
          </Button>
        </Link>

        <Button 
          variant={"ghost"}
          onClick={toggleTheme}
          className="cursor-pointer"
        >
          {theme === "dark" ?
            <Sun className="w-5 h-5" /> :
            <Moon className="w-5 h-5" />
          }
        </Button>
      </div>

    </header>
  );
}
