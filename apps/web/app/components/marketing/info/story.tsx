import { Badge } from "~/components/ui/badge";

export default function StorySection() {
  return (
    <section
      id="story"
      className="py-16 px-4 flex flex-col items-center gap-6 bg-background/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg flex flex-col gap-4">
        <Badge className="w-fit">About AECFolio</Badge>
        <h1 className="text-2xl font-bold tracking-wide">
          Built at AEC, for AEC.
        </h1>
        <div className="flex flex-col gap-3 text-sm text-foreground/70 leading-relaxed">
          <p>
            AECFolio started as a mini project for the 6th semester CSE
            curriculum at Assam Engineering College. The goal was
            straightforward: build a centralized system where students could
            maintain verified academic records and generate placement-ready CVs
            without the chaos of outdated spreadsheets and manually formatted
            resumes.
          </p>
          <p>
            But we built it with the hope that it wouldn't stop there. AECFolio
            is designed to be a system the college can genuinely adopt and use
            long-term — one that grows with each batch, with maintainers passing
            the baton forward while the platform continues to serve students and
            faculty.
          </p>
          <p>
            If you're a student or faculty member and have feedback or found a
            bug, we'd love to hear from you.
          </p>
        </div>
      </div>
    </section>
  );
}
