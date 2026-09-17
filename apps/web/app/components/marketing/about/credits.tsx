import { Github } from "@aecfolio/ui/icons";
import { m } from "motion/react";
import { Button } from "~/components/ui/button";
import { MAINTAINER_CONTACT } from "~/lib/contact";
import { REPO_URL } from "~/lib/links";
import { RevealEmail } from "./reveal-email";

const MAINTAINER = {
  name: "Poran Dip Boruah",
  github: "https://github.com/poran-dip",
};

const PROTOTYPE_CONTRIBUTORS = [
  { name: "Ankur Jyoti Das", url: "https://github.com/Ankurjtydas" },
  { name: "Jhaiklong Basumatary", url: "https://github.com/jhaiklong123" },
];

function InlineLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-ink underline decoration-primary-line decoration-2 underline-offset-4 transition-colors hover:text-primary-text hover:decoration-primary"
    >
      {children}
    </a>
  );
}

export function Credits() {
  return (
    <m.section
      id="credits"
      aria-labelledby="credits-heading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex scroll-mt-20 flex-col gap-5"
    >
      <h2
        id="credits-heading"
        className="text-xl font-semibold tracking-tight text-ink"
      >
        Credits and contact
      </h2>

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-ink">{MAINTAINER.name}</p>
          <p className="text-sm font-medium text-primary-text">
            Lead developer and maintainer · CSE, batch of 2027
          </p>
        </div>
        <p className="leading-relaxed text-ink">
          Took AECFolio from a sixth-semester prototype to the production-ready
          system it is today, and maintains it. Bug reports, feedback and
          questions about the platform itself are welcome by email.
        </p>
        <div className="flex flex-wrap gap-3">
          <RevealEmail encoded={MAINTAINER_CONTACT} />
          <Button asChild variant="secondary">
            <a
              href={MAINTAINER.github}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github />
              GitHub
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
              Source code
            </a>
          </Button>
        </div>
      </div>

      <p className="leading-relaxed text-ink">
        The original prototype was built together with{" "}
        <InlineLink href={PROTOTYPE_CONTRIBUTORS[0].url}>
          {PROTOTYPE_CONTRIBUTORS[0].name}
        </InlineLink>{" "}
        and{" "}
        <InlineLink href={PROTOTYPE_CONTRIBUTORS[1].url}>
          {PROTOTYPE_CONTRIBUTORS[1].name}
        </InlineLink>
        .
      </p>

      <p className="border-l-2 border-primary-line pl-4 text-sm leading-relaxed text-ink-muted">
        For questions about your account, results or verification status,
        contact your department first.
      </p>
    </m.section>
  );
}
