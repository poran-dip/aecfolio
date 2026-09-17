import { m } from "motion/react";
import { useRouteLoaderData } from "react-router";
import { HowItWorks } from "~/components/marketing/home/how-it-works";
import {
  SignInError,
  SignInPanel,
} from "~/components/marketing/home/sign-in-panel";
import { Container } from "~/components/ui/container";
import { Section } from "~/components/ui/section";
import type { Route } from "./+types/home";
import type { loader as layoutLoader } from "./layout";

export function loader({ request }: Route.LoaderArgs) {
  return { error: new URL(request.url).searchParams.get("error") };
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "AECFolio · Assam Engineering College" },
    {
      name: "description",
      content:
        "Verified academic records and placement-ready CVs for students of Assam Engineering College.",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const layout = useRouteLoaderData<typeof layoutLoader>(
    "routes/marketing/layout",
  );

  return (
    <Section emphasis>
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <m.div
          initial={{ opacity: 0.6, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-6"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-line bg-surface-raised px-3 py-1 text-xs font-medium text-primary-text">
            <span className="size-1.5 rounded-full bg-brand" />
            Assam Engineering College
          </p>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              Your academic record,{" "}
              <span className="text-primary">verified</span> and ready to share.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Keep your results, projects and certifications in one place, have
              them verified by the college, and export a CV whenever you need
              one.
            </p>
          </div>
          <SignInPanel userName={layout?.user?.name ?? null} />
          {!layout?.user && loaderData.error && (
            <SignInError code={loaderData.error} />
          )}
        </m.div>
        <HowItWorks />
      </Container>
    </Section>
  );
}
