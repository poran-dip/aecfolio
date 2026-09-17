import { m } from "motion/react";
import { Credits } from "~/components/marketing/about/credits";
import { Container } from "~/components/ui/container";
import { Section } from "~/components/ui/section";
import type { Route } from "./+types/about";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "About · AECFolio" },
    {
      name: "description",
      content:
        "How AECFolio came to be, who builds it, and how to get in touch.",
    },
  ];
}

export default function About() {
  return (
    <>
      <Section>
        <Container className="max-w-3xl py-12 sm:py-16">
          <m.header
            initial={{ opacity: 0.6, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3"
          >
            <p className="text-sm font-semibold text-primary-text">About</p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
              Built at AEC, for AEC.
            </h1>
          </m.header>
          <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-ink sm:text-lg">
            <p>
              AECFolio is where students of Assam Engineering College keep their
              academic record: semester results, projects, experience,
              certifications and achievements. The college verifies the entries
              that need verifying, and a CV in the college's standard format can
              be exported at any time.
            </p>
            <p>
              It began as a sixth-semester mini project in the Department of
              Computer Science and Engineering, built to replace scattered
              spreadsheets and hand-formatted résumés. In the seventh semester
              it was rebuilt from the ground up into a production-ready system,
              designed to run on the college's own servers and to be maintained
              by the batches that follow.
            </p>
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl py-12 sm:py-16">
          <Credits />
        </Container>
      </Section>
    </>
  );
}
