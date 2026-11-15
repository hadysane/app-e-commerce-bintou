import { queryOptions } from "@tanstack/react-query";
import { getCatalog, getStock } from "./shop.functions";

export const stockQueryOptions = queryOptions({
  queryKey: ["stock"],
  queryFn: () => getStock(),
  staleTime: 30_000,
});

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});
