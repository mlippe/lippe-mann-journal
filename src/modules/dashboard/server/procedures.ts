import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { photos, posts, collections, likes, comments } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dashboardRouter = createTRPCRouter({
  getJournalActivity: protectedProcedure.query(async ({ ctx }) => {
    // Build the last 12 months (including current month) in YYYY-MM format
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthKeys: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      monthKeys.push(`${yyyy}-${mm}`);
    }

    const [
      postsByMonthRows,
      framesByMonthRows,
      sessionRows,
      privateCountRows,
      likesCountRows,
      commentsCountRows,
      recentCommentsRows,
    ] = await Promise.all([
      // 1. Posts grouped by YYYY-MM and type
      ctx.db
        .select({
          month: sql<string>`TO_CHAR(${posts.createdAt}, 'YYYY-MM')`,
          type: posts.type,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(posts)
        .where(sql`${posts.createdAt} >= ${startDate}`)
        .groupBy(sql`TO_CHAR(${posts.createdAt}, 'YYYY-MM')`, posts.type),

      // 2. Uploaded/taken frames grouped by YYYY-MM (fallback to createdAt when EXIF date is absent)
      ctx.db
        .select({
          month: sql<string>`TO_CHAR(COALESCE(${photos.dateTimeOriginal}, ${photos.createdAt}), 'YYYY-MM')`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(photos)
        .where(
          sql`COALESCE(${photos.dateTimeOriginal}, ${photos.createdAt}) >= ${startDate}`,
        )
        .groupBy(
          sql`TO_CHAR(COALESCE(${photos.dateTimeOriginal}, ${photos.createdAt}), 'YYYY-MM')`,
        ),

      // 3. All SESSION posts with frame & pick counts to identify open "Finale Wahl"
      ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          visibility: posts.visibility,
          createdAt: posts.createdAt,
          revisitedAt: posts.revisitedAt,
          totalFrames: sql<number>`(
            SELECT COUNT(*)::int FROM posts_to_photos ptp WHERE ptp.post_id = ${posts.id}
          )`,
          initialPicks: sql<number>`(
            SELECT COUNT(*)::int FROM posts_to_photos ptp WHERE ptp.post_id = ${posts.id} AND ptp.is_initial_pick = true
          )`,
          revisitedPicks: sql<number>`(
            SELECT COUNT(*)::int FROM posts_to_photos ptp WHERE ptp.post_id = ${posts.id} AND ptp.is_revisited_pick = true
          )`,
        })
        .from(posts)
        .where(eq(posts.type, 'SESSION'))
        .orderBy(desc(posts.createdAt)),

      // 4. Private drafts count
      ctx.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(posts)
        .where(eq(posts.visibility, 'private')),

      // 5. Total likes & how many posts/visitors they span
      ctx.db
        .select({
          count: sql<number>`COUNT(*)::int`,
          likedPostsCount: sql<number>`COUNT(DISTINCT ${likes.postId})::int`,
          uniqueLikers: sql<number>`COUNT(DISTINCT ${likes.userFingerprint})::int`,
        })
        .from(likes),

      // 6. Total comments
      ctx.db.select({ count: sql<number>`COUNT(*)::int` }).from(comments),

      // 7. Recent comments with post info
      ctx.db
        .select({
          id: comments.id,
          username: comments.username,
          content: comments.content,
          createdAt: comments.createdAt,
          postTitle: posts.title,
          postSlug: posts.slug,
          postType: posts.type,
        })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .orderBy(desc(comments.createdAt))
        .limit(3),
    ]);

    const monthlyData = monthKeys.map((month) => {
      const monthPostRows = postsByMonthRows.filter((r) => r.month === month);
      const sessions =
        monthPostRows.find((r) => r.type === 'SESSION')?.count ?? 0;
      const albums = monthPostRows.find((r) => r.type === 'ALBUM')?.count ?? 0;
      const singlePhotos =
        monthPostRows.find((r) => r.type === 'PHOTO')?.count ?? 0;
      const articles =
        monthPostRows.find((r) => r.type === 'ARTICLE')?.count ?? 0;
      const frames =
        framesByMonthRows.find((r) => r.month === month)?.count ?? 0;

      return {
        month,
        sessions,
        albums,
        photos: singlePhotos,
        articles,
        totalPosts: sessions + albums + singlePhotos + articles,
        frames,
      };
    });

    const pendingRevisitSessions = sessionRows
      .filter((s) => !s.revisitedAt && s.revisitedPicks === 0)
      .slice(0, 4)
      .map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        visibility: s.visibility,
        createdAt: s.createdAt,
        totalFrames: s.totalFrames,
        initialPicks: s.initialPicks,
      }));

    const revisitedSessionsCount = sessionRows.filter(
      (s) => Boolean(s.revisitedAt) || s.revisitedPicks > 0,
    ).length;

    return {
      monthlyData,
      curation: {
        totalSessions: sessionRows.length,
        revisitedSessionsCount,
        pendingRevisitCount: sessionRows.length - revisitedSessionsCount,
        privateDraftsCount: privateCountRows[0]?.count ?? 0,
        pendingRevisitSessions,
      },
      resonance: {
        totalLikes: likesCountRows[0]?.count ?? 0,
        likedPostsCount: likesCountRows[0]?.likedPostsCount ?? 0,
        uniqueLikers: likesCountRows[0]?.uniqueLikers ?? 0,
        totalComments: commentsCountRows[0]?.count ?? 0,
        recentComments: recentCommentsRows,
      },
    };
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalPhotosResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(photos);
    const totalPhotos = totalPhotosResult?.count ?? 0;

    const [totalPostsResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(posts);
    const totalPosts = totalPostsResult?.count ?? 0;

    const postsByTypeResult = await ctx.db
      .select({ type: posts.type, count: sql<number>`COUNT(*)::int` })
      .from(posts)
      .groupBy(posts.type);

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
