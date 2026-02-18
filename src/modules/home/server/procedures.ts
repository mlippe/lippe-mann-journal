import { z } from 'zod';
import { createTRPCRouter, baseProcedure } from '@/trpc/init';
import { desc, eq, and, count } from 'drizzle-orm';
import { collections, photos, postsWithPhotos, posts } from '@/db/schema';
import { TRPCError } from '@trpc/server';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants';

// Define Zod schema for the output of getPublicFeed
const publicFeedOutputSchema = z.object({
  items: z.array(postsWithPhotos), // Use postsWithPhotos schema
  nextCursor: z.number().optional(),
  total: z.number(),
  totalPages: z.number(),
});

export const homeRouter = createTRPCRouter({
  getManyPhotos: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input;

      const data = await ctx.db
        .select()
        .from(photos)
        .where(eq(photos.visibility, 'public'))
        .orderBy(desc(photos.updatedAt))
        .limit(limit);

      return data;
    }),
  getFeaturedCollections: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input;

      const data = await ctx.db.query.collections.findMany({
        where: (collections, { eq }) => eq(collections.isFeatured, true),
        orderBy: [desc(collections.updatedAt)],
        limit: limit,
      });

      return data;
    }),
  getPhotoById: baseProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const data = await ctx.db.query.photos.findFirst({
        where: and(eq(photos.id, id), eq(photos.visibility, 'public')),
      });

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Photo not found',
        });
      }

      return data;
    }),
  getPublicFeed: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE), // Renamed from pageSize
        cursor: z.number().nullish(), // Added cursor, representing the next page number
      }),
    )
    .output(publicFeedOutputSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const cursor = input.cursor ?? 1; // Default to page 1 if no cursor

      const data = await ctx.db.query.posts.findMany({
        where: eq(posts.visibility, 'public'),
        orderBy: [desc(posts.createdAt)],
        limit: limit,
        offset: (cursor - 1) * limit, // Use cursor as page number
        with: {
          postsToPhotos: {
            with: {
              photo: true,
            },
            orderBy: (postsToPhotos, { asc }) => [asc(postsToPhotos.sortOrder)],
          },
        },
      });

      const hasMore = data.length === limit;
      const nextCursor = hasMore ? cursor + 1 : undefined;

      const [total] = await ctx.db
        .select({
          count: count(),
        })
        .from(posts)
        .where(eq(posts.visibility, 'public'));

      const totalPages = Math.ceil(total.count / limit); // Use limit instead of pageSize

      return {
        items: data,
        nextCursor,
        total: total.count,
        totalPages,
      };
    }),
});
