import { createTRPCRouter } from '../init';
import { postsRouter } from '@/modules/posts/server/procedures';
import { photosRouter } from '@/modules/photos/server/procedures';
import { s3Router } from '@/modules/s3/server/procedures';
import { homeRouter } from '@/modules/home/server/procedures';
import { feedRouter } from '@/modules/feed/server/procedures';
import { blogRouter } from '@/modules/blog/server/procedures';
import { dashboardRouter } from '@/modules/dashboard/server/procedures';

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  photos: photosRouter,
  s3: s3Router,
  home: homeRouter,
  feed: feedRouter,
  blog: blogRouter,
  dashboard: dashboardRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
