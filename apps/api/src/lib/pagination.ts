import type { PaginatedData } from "@aecfolio/shared";
import { z } from "zod";

export const PAGE_SIZE_DEFAULT = 25;
export const PAGE_SIZE_MAX = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toOffset({ page, pageSize }: PaginationQuery) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

export function toPage<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationQuery,
): PaginatedData<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasNext: page * pageSize < total,
  };
}
