import { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/trpc/routers/_app";

export type SocialInteractionsData = inferRouterOutputs<
  typeof appRouter
>["social"]["getInteractions"];
