import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Briefcase, Building2, ExternalLink, GraduationCap, Info, LogIn, Phone } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="w-full bg-background/60 border-t border-border/60 px-4 sm:px-6 pt-12 pb-8">
      {/* Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Branding */}
        <div className="flex flex-col gap-4">
          {/* Logo + Name */}
          <Link href={"/"} className="inline-flex items-center gap-3 w-fit">
            <Image src="/logo.png" alt="AEC" width={28} height={28} className="w-7 h-7" />
            <h3 className="text-lg font-bold tracking-wide">AECFolio</h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-foreground/70">
            The student information and portfolio system for Assam Engineering College.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <Link href={"/dashboard"}>
              <Button className="cursor-pointer">
                Sign in to AECFolio
              </Button>
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 space-y-8 sm:gap-4 sm:space-y-0">
          {/* About */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold">ABOUT</p>
            <ul className="flex flex-col gap-3 text-sm text-foreground/70">
              <li>
                <Link href={"https://aec.ac.in"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <p>About AEC</p>
                </Link>
              </li>
              <li>
                <Link href={"/info"} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>About AECFolio</p>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold">RESOURCES</p>
            <ul className="flex flex-col gap-3 text-sm text-foreground/70">
              <li>
                <Link href={"https://placement.aec.ac.in/"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <p>Placement Cell</p>
                </Link>
              </li>
              <li>
                <Link href={"/info#get-in-touch"} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                  <p>Contact Us</p>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Separator className="mt-12 mb-8" />

      {/* Bottom */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 px-4">
        <p className="text-sm text-foreground/70">© {new Date().getFullYear()} AECFolio. All Rights Reserved.</p>

        <p className="text-center sm:text-start text-sm text-foreground/70">Designed & developed by the CSE batch of 2027, AEC.</p>
      </div>
    </footer>
  );
}
