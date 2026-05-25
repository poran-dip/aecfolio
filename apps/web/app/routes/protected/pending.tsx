import { redirect } from "react-router";
import PendingApprovalScreen from "~/components/protected/pending";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import { redirectByRole } from "~/lib/auth-redirect";
import { getSession } from "~/lib/session";
import type { Route } from "./+types/pending";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Pending | AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  if (session.user.role !== "PENDING") redirectByRole(session.user.role);

  try {
    const res = await apiClient.api.me.onboarding.$get();
    const data = await parseApi(res);
    return { user: session.user, onboarding: data };
  } catch {
    return { user: session.user, onboarding: null };
  }
}

export default function PendingPage({ loaderData }: Route.ComponentProps) {
  return <PendingApprovalScreen onboarding={loaderData?.onboarding ?? null} />;
}
