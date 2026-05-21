import GenerateCV from "~/components/protected/students/cv";
import type { Route } from "./+types/cv";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Generate CV | AECFolio" }];
}

export default function StudentCVPage() {
  return <GenerateCV />;
}
