import type { AppType } from "@aecfolio/api";
import { hc } from "hono/client";
import { ApiErrorWithDetails } from "./api";
import { apiBase } from "./config";

type Failure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

type JsonResponse = { json: () => Promise<unknown> };

type JsonOf<R> = R extends { json: () => Promise<infer J> } ? J : never;

type DataOf<R> =
  Extract<JsonOf<R>, { success: true }> extends {
    data: infer D;
  }
    ? D
    : never;

export function api(request: Request) {
  return hc<AppType>(apiBase, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
}

export async function unwrap<R extends JsonResponse>(
  response: R,
): Promise<DataOf<R>> {
  const json = (await response.json()) as
    | { success: true; data: unknown }
    | Failure;

  if (!json.success) {
    throw new ApiErrorWithDetails(
      json.error.message,
      json.error.code,
      json.error.details,
    );
  }

  return json.data as DataOf<R>;
}

export async function unwrapOr404<R extends JsonResponse>(
  response: R,
): Promise<DataOf<R>> {
  try {
    return await unwrap(response);
  } catch (error) {
    if (error instanceof ApiErrorWithDetails && error.code === "NOT_FOUND") {
      throw new Response("Not found", { status: 404 });
    }
    throw error;
  }
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; message: string; code: string; details?: unknown };

export async function attempt<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await run();
    return { ok: true, data } as ActionResult<T>;
  } catch (error) {
    if (error instanceof ApiErrorWithDetails) {
      return {
        ok: false,
        message: error.message,
        code: error.code,
        details: error.details,
      };
    }
    throw error;
  }
}
