import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Button } from "./components/ui/button";
import { Container } from "./components/ui/container";
import { getPublicEnv } from "./lib/env.server";

export function loader() {
  return { env: getPublicEnv() };
}

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "/favicon-96x96.png",
    sizes: "96x96",
  },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
];

function PublicEnvScript() {
  const data = useRouteLoaderData<typeof loader>("root");
  const json = JSON.stringify(data?.env ?? {}).replace(/</g, "\\u003c");

  return (
    <script dangerouslySetInnerHTML={{ __html: `window.__ENV__=${json}` }} />
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <PublicEnvScript />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let details = "An unexpected error occurred. Please try again in a moment.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      details =
        "The page you are looking for does not exist or has been moved.";
    } else if (error.statusText) {
      details = error.statusText;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container className="flex min-h-svh flex-col items-start justify-center gap-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-md text-base text-ink-muted sm:text-lg">{details}</p>
      <Button asChild>
        <a href="/">Back to home</a>
      </Button>
      {stack && (
        <pre className="w-full overflow-x-auto rounded-lg bg-surface-sunken p-4 text-sm text-ink">
          <code>{stack}</code>
        </pre>
      )}
    </Container>
  );
}
