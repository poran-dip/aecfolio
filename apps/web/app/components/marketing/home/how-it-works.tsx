import { m } from "motion/react";

const steps = [
  {
    title: "Sign in with your college email",
    body: "Sign in with your college Google account ending in @aec.ac.in.",
  },
  {
    title: "Build your profile",
    body: "Add your semester results, projects, experience, certifications and achievements, with proof where it applies.",
  },
  {
    title: "Get verified and export your CV",
    body: "The college reviews your results and certificates. Verified entries are marked on every CV you export.",
  },
];

export function HowItWorks() {
  return (
    <m.section
      aria-labelledby="how-it-works"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-line bg-surface-raised p-5 shadow-sm sm:p-6"
    >
      <h2
        id="how-it-works"
        className="text-sm font-semibold uppercase tracking-wider text-primary-text"
      >
        How it works
      </h2>
      <ol className="mt-5 flex flex-col">
        {steps.map((step, index) => (
          <m.li
            key={step.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative flex gap-3.5 pb-5 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary-line bg-primary-surface text-sm font-semibold text-primary-text">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="mt-1.5 w-px flex-1 bg-line group-last:hidden"
              />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <h3 className="text-base font-semibold text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </div>
          </m.li>
        ))}
      </ol>
    </m.section>
  );
}
