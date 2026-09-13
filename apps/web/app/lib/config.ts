export type PublicEnv = {
  API_URL: string;
};

declare global {
  interface Window {
    __ENV__?: Partial<PublicEnv>;
  }
}

function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://localhost:3002";
  }

  return window.__ENV__?.API_URL ?? window.location.origin;
}

export const apiBase = resolveApiBase();
