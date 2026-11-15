import { queryOptions } from "@tanstack/react-query";
import { getStock } from "./shop.functions";

export const stockQueryOptions = queryOptions({
  queryKey: ["stock"],
  queryFn: () => getStock(),
  staleTime: 30_000,
});
