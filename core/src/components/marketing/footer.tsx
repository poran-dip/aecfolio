import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Briefcase, Building2, ExternalLink, GraduationCap, Info, LogIn, Phone } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-border px-4 sm:px-6 pt-12 pb-8">
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
          <p className="text-sm text-muted-foreground">
            The academic portfolio platform built for Assam Engineering College — 
            verified profiles, placement-ready, and open to recruiters.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <Link href={"/login"}>
              <Button className="cursor-pointer">
                Create Your Profile
              </Button>
            </Link>

            <Link href={"/talent"}>
              <Button variant={"link"} className="cursor-pointer">
                Browse Talents
                <ExternalLink className="w-4 h-4 shrink-0 inline" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 space-y-8 sm:gap-4 sm:space-y-0">
          {/* Product */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold">PRODUCT</p>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href={"/talent"} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <p>Talent</p>
                </Link>
              </li>
              <li>
                <Link href={"/dashboard"} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <LogIn className="w-4 h-4 shrink-0" />
                  <p>Dashboard</p>
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold">ABOUT</p>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href={"https://aec.ac.in"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <p>About AEC</p>
                </Link>
              </li>
              <li>
                <Link href={"/about"} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>About AECFolio</p>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold">RESOURCES</p>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href={"https://placement.aec.ac.in/"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <p>Placement Cell</p>
                </Link>
              </li>
              <li>
                <Link href={"https://www.aec.ac.in/office/contact"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                  <p>Contact Us</p>
                </Link>
              </li>
              <li>
                <Link href={"https://www.aec.ac.in/mandatory-disclosure"} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  <p>AICTE Approvals</p>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Separator className="mt-12 mb-8" />

      {/* Bottom */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 px-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AECFolio. All Rights Reserved.</p>

        <div className="flex gap-6">
          <Link href={"/terms"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link href={"/privacy"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
