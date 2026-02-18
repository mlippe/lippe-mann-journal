import { createTRPCRouter } from '../init';
import { postsRouter } from '@/modules/articles/server/procedures';
import { photosRouter } from '@/modules/photos/server/procedures';
import { s3Router } from '@/modules/s3/server/procedures';
import { homeRouter } from '@/modules/home/server/procedures';
import { blogRouter } from '@/modules/blog/server/procedures';
import { dashboardRouter } from '@/modules/dashboard/server/procedures';
import { collectionsRouter } from '@/modules/collections/server/procedures'; // New import

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  photos: photosRouter,
  s3: s3Router,
  home: homeRouter,
  blog: blogRouter,
  dashboard: dashboardRouter,
  collections: collectionsRouter, // New router
});
// export type definition of API
export type AppRouter = typeof appRouter;
