import { data, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { Section } from "~/components/ui/section";
import type { Route } from "./+types/not-found";

export function loader() {
  return data(null, { status: 404 });
}

export function meta(_: Route.MetaArgs) {
  return [{ title: "Page not found · AECFolio" }];
}

export default function NotFound() {
  return (
    <Section>
      <Container className="flex flex-col items-start gap-4 py-28 sm:py-32">
        <p className="text-sm font-semibold text-primary-text">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Page not found
        </h1>
        <p className="max-w-md text-base text-ink-muted sm:text-lg">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </Container>
    </Section>
  );
}
