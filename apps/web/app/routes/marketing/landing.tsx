import FAQSection from "~/components/marketing/home/faq";
import HeroSection from "~/components/marketing/home/hero";
import HowItWorksSection from "~/components/marketing/home/how-it-works";
import type { Route } from "./+types/landing";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "AECFolio" },
    {
      name: "description",
      content:
        "Verified academic profiles, one-click CVs, and placement tools for students at Assam Engineering College.",
    },
  ];
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <FAQSection />
    </div>
  );
}
