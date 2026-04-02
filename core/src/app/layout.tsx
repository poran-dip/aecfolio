import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    template: "%s | AEC Profiles",
    default: "AEC Profiles — Student Information System",
  },
  description:
    "Assam Engineering College Student Information System. Manage academic records, build your professional profile, and generate standardized CVs.",
  keywords: ["AEC", "Assam Engineering College", "Student Profile", "CV Generator", "Academic Records"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
