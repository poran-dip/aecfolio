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
  return <div />;
}
