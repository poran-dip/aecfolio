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
  return <div />;
}
