import { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/trpc/routers/_app";

export type PostGetOne = inferRouterOutputs<
  typeof appRouter
>["posts"]["getOne"];

export type PostGetPublished = inferRouterOutputs<
  typeof appRouter
>["posts"]["getPublished"];
