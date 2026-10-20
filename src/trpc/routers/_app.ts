import { createTRPCRouter } from '../init';
import { postsRouter } from '@/modules/posts/server/procedures';
import { photosRouter } from '@/modules/photos/server/procedures';
import { s3Router } from '@/modules/s3/server/procedures';
import { dashboardRouter } from '@/modules/dashboard/server/procedures';
import { collectionsRouter } from '@/modules/collections/server/procedures';
import { socialRouter } from '@/modules/social/server/procedures';

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  photos: photosRouter,
  s3: s3Router,
  dashboard: dashboardRouter,
  collections: collectionsRouter,
  social: socialRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
