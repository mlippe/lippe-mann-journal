import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { eq, and, sql, desc } from 'drizzle-orm';
import { likes, comments } from '@/db/schema';

export const socialRouter = createTRPCRouter({
  toggleLike: baseProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        userFingerprint: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, userFingerprint } = input;

      const existingLike = await ctx.db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userFingerprint, userFingerprint),
          ),
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await ctx.db
          .delete(likes)
          .where(
            and(
              eq(likes.postId, postId),
              eq(likes.userFingerprint, userFingerprint),
            ),
          );
        return { liked: false };
      } else {
        // Like
        await ctx.db.insert(likes).values({
          postId,
          userFingerprint,
        });
        return { liked: true };
      }
    }),

  addComment: baseProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        userFingerprint: z.string().min(1),
        username: z.string().min(1),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, userFingerprint, username, content } = input;

      const [newComment] = await ctx.db
        .insert(comments)
        .values({
          postId,
          userFingerprint,
          username,
          content,
        })
        .returning();

      return newComment;
    }),

  updateUsername: baseProcedure
    .input(
      z.object({
        userFingerprint: z.string().min(1),
        newUsername: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userFingerprint, newUsername } = input;

      await ctx.db
        .update(comments)
        .set({ username: newUsername })
        .where(eq(comments.userFingerprint, userFingerprint));

      return { success: true };
    }),

  getInteractions: baseProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        userFingerprint: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { postId, userFingerprint } = input;

      const [likeCountResult] = await ctx.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(likes)
        .where(eq(likes.postId, postId));

      const commentList = await ctx.db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

      let hasLiked = false;
      if (userFingerprint) {
        const [likeRecord] = await ctx.db
          .select()
          .from(likes)
          .where(
            and(
              eq(likes.postId, postId),
              eq(likes.userFingerprint, userFingerprint),
            ),
          )
          .limit(1);
        hasLiked = !!likeRecord;
      }

      return {
        likeCount: Number(likeCountResult?.count || 0),
        hasLiked,
        comments: commentList,
      };
    }),
});
