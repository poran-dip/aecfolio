import { Link, useRouteLoaderData } from "react-router";
import { Logo } from "~/components/brand/logo";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { signOut } from "~/lib/auth-client";
import type { Route } from "./+types/dashboard";
import type { loader as layoutLoader } from "./layout";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Dashboard · AECFolio" }];
}

export default function Dashboard() {
  const data = useRouteLoaderData<typeof layoutLoader>("routes/app/layout");
  const user = data?.user;

  return (
    <Container className="flex min-h-svh flex-col items-start justify-center gap-4 py-12">
      <Logo />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl tracking-tight text-ink">
          Signed in as {user?.name}
        </h1>
        <p className="text-ink-muted">
          {user?.email} · {user?.role}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="secondary">
          <Link to="/">Home</Link>
        </Button>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
    </Container>
  );
}
