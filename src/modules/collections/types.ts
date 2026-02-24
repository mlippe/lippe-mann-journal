import { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/trpc/routers/_app";

export type CollectionGetPostsInCollection = inferRouterOutputs<
  typeof appRouter
>["collections"]["getPostsInCollection"];
