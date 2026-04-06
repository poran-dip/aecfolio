import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s | AECFolio",
    default: "AECFolio",
  },
  description:
    "Verified academic profiles, one-click CVs, and placement tools for students at Assam Engineering College.",
  keywords: [
    "AEC",
    "Assam Engineering College",
    "Student Profile",
    "CV Generator",
    "Academic Records",
    "Placement",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "font-sans", "scroll-smooth", inter.variable)}
    >
      <body className="min-h-full flex flex-col antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
