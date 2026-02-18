import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { photos, posts, collections } from "@/db/schema";
import { sql, and, gte } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
  getPhotosCountByMonth: protectedProcedure
    .input(
      z
        .object({
          years: z.number().min(1).max(10).default(3),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const years = input?.years ?? 3;

      // Calculate the start date (years ago from now)
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - years);

      const result = await ctx.db
        .select({
          month: sql<string>`TO_CHAR(${photos.dateTimeOriginal}, 'YYYY-MM')`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(photos)
        .where(sql`${photos.dateTimeOriginal} >= ${startDate}`)
        .groupBy(sql`TO_CHAR(${photos.dateTimeOriginal}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${photos.dateTimeOriginal}, 'YYYY-MM')`);

      // Fill in missing months with 0 count
      const monthlyData: { month: string; count: number }[] = [];
      const currentDate = new Date(startDate);
      const endDate = new Date();

      while (currentDate <= endDate) {
        const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
        const existingData = result.find((item) => item.month === monthKey);

        monthlyData.push({
          month: monthKey,
          count: existingData?.count ?? 0,
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return monthlyData;
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Get total photo count
    const [totalPhotosResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(photos);
    const totalPhotos = totalPhotosResult?.count ?? 0;

    // Get total posts count
    const [totalPostsResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(posts);
    const totalPosts = totalPostsResult?.count ?? 0;
    
    // Get posts by type
    const postsByTypeResult = await ctx.db
      .select({ type: posts.type, count: sql<number>`COUNT(*)::int` })
      .from(posts)
      .groupBy(posts.type);

    // Get total collections
    const [totalCollectionsResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(collections);
    const totalCollections = totalCollectionsResult?.count ?? 0;

    return {
      totalPhotos,
      totalPosts,
      postsByType: postsByTypeResult,
      totalCollections,
    };
  }),
});
