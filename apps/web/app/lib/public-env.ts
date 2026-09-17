import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

export function usePublicApiUrl(): string {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  return data?.env.API_URL ?? "";
}

export function userAvatarUrl(apiUrl: string, userId: string): string {
  return `${apiUrl}/api/users/${userId}/avatar`;
}
