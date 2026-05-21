import type { ApiError, ApiResponse, PaginatedData } from "@aecfolio/shared";

export class ApiErrorWithDetails extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ApiErrorWithDetails";
  }
}

export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    const error = json as unknown as { error: ApiError["error"] };
    throw new ApiErrorWithDetails(
      error.error.message,
      error.error.code,
      error.error.details,
    );
  }

  return json.data;
}

export async function fetchApiPaginated<T>(
  url: string,
  options?: RequestInit,
): Promise<PaginatedData<T>> {
  const res = await fetch(url, options);
  const json: ApiResponse<PaginatedData<T>> = await res.json();

  if (!json.success) {
    const error = json as unknown as { error: ApiError["error"] };
    throw new ApiErrorWithDetails(
      error.error.message,
      error.error.code,
      error.error.details,
    );
  }

  return json.data;
}
