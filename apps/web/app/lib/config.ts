const isServer = typeof window === "undefined";

export const apiBase = isServer
  ? (process.env.INTERNAL_API_URL ?? "http://api:3002")
  : (import.meta.env.VITE_API_URL ?? "/api");
