import type { ApiResponse } from "@aecfolio/shared";

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

export async function parseApi<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    const { error } = json;
    throw new ApiErrorWithDetails(error.message, error.code, error.details);
  }
  return json.data;
}
