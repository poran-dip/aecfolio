import ContributorsSection from "~/components/marketing/info/contributors";
import GetInTouchSection from "~/components/marketing/info/get-in-touch";
import StorySection from "~/components/marketing/info/story";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/info";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Info | AECFolio" },
    {
      name: "description",
      content:
        "Verified academic profiles, one-click CVs, and placement tools for students at Assam Engineering College.",
    },
  ];
}

export default function InfoPage() {
  return (
    <div className="min-h-screen pt-16">
      <StorySection />
      <Separator />
      <ContributorsSection />
      <Separator />
      <GetInTouchSection />
    </div>
  );
}
