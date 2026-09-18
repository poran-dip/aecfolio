import { parseApi } from "./api";
import { apiBase } from "./config";

async function send<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseApi<T>(response);
}

export const studentApi = {
  me: (body: unknown) => send("/api/me", "PATCH", body),
  profile: (body: unknown) => send("/api/me/student", "PATCH", body),

  create: <T extends { id: string }>(entity: string, body: unknown) =>
    send<T>(`/api/${entity}`, "POST", body),
  update: (entity: string, id: string, body: unknown) =>
    send(`/api/${entity}/${id}`, "PATCH", body),
  remove: (entity: string, id: string) =>
    send(`/api/${entity}/${id}`, "DELETE"),

  sectionEntry: {
    create: <T extends { id: string }>(sectionId: string, body: unknown) =>
      send<T>(`/api/custom-sections/${sectionId}/entries`, "POST", body),
    update: (sectionId: string, entryId: string, body: unknown) =>
      send(
        `/api/custom-sections/${sectionId}/entries/${entryId}`,
        "PATCH",
        body,
      ),
    remove: (sectionId: string, entryId: string) =>
      send(`/api/custom-sections/${sectionId}/entries/${entryId}`, "DELETE"),
  },

  preferences: (body: unknown) => send("/api/cv/preferences", "PUT", body),
  exportSelf: (body: unknown) =>
    send<{ export: { id: string }; cached: boolean }>(
      "/api/cv/exports/self",
      "POST",
      body,
    ),
};

export function entityApi<T>(entity: string, toPayload: (value: T) => unknown) {
  return {
    async create(value: T) {
      const row = await studentApi.create<{ id: string }>(
        entity,
        toPayload(value),
      );
      return row.id;
    },
    async update(id: string, value: T) {
      await studentApi.update(entity, id, toPayload(value));
    },
    async remove(id: string) {
      await studentApi.remove(entity, id);
    },
  };
}
