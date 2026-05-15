import { z } from 'zod';
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from '@/trpc/init';
import { desc, count, eq, and } from 'drizzle-orm';
import {
  collections,
  posts,
  postsWithPhotos,
  postsToCollections,
  PostWithPhotos,
  collectionsInsertSchema,
  collectionsUpdateSchema,
  Collection,
  Post,
} from '@/db/schema';
import { TRPCError } from '@trpc/server';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants';
import { Context } from 'node:vm';

// Zod schema for the output of getPostsInCollection
export const postsInCollectionOutputSchema = z.object({
  items: z.array(postsWithPhotos),
  nextCursor: z.number().optional(),
  total: z.number(),
  totalPages: z.number(),
});

// Helper to enhance collection data with post count and latest image
async function enhanceCollection(ctx: Context, collection: Collection) {
  const [postCountResult] = await ctx.db
    .select({ count: count() })
    .from(postsToCollections)
    .innerJoin(posts, eq(postsToCollections.postId, posts.id))
    .where(
      and(
        eq(postsToCollections.collectionId, collection.id),
        eq(posts.visibility, 'public'),
      ),
    );

  const latestPost = await ctx.db.query.posts.findFirst({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: (posts: Post, { exists, and, eq }: any) =>
      and(
        eq(posts.visibility, 'public'),
        exists(
          ctx.db
            .select()
            .from(postsToCollections)
            .where(
              and(
                eq(postsToCollections.postId, posts.id),
                eq(postsToCollections.collectionId, collection.id),
              ),
            ),
        ),
      ),
    orderBy: [desc(posts.createdAt)],
    columns: {
      coverImage: true,
    },
  });

  return {
    ...collection,
    postCount: (postCountResult?.count as number) ?? 0,
    latestPostImage: (latestPost?.coverImage as string) ?? null,
  };
}

export const collectionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(collectionsInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const [newCollection] = await ctx.db
        .insert(collections)
        .values(input)
        .returning();
      return newCollection;
    }),

  update: protectedProcedure
    .input(collectionsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;
      if (!id)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ID is required' });

      const [updatedCollection] = await ctx.db
        .update(collections)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(collections.id, id))
        .returning();

      if (!updatedCollection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }
      return updatedCollection;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedCollection] = await ctx.db
        .delete(collections)
        .where(eq(collections.id, input.id))
        .returning();

      if (!deletedCollection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }
      return deletedCollection;
    }),

  getAllCollections: baseProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(MAX_PAGE_SIZE).default(MAX_PAGE_SIZE),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? MAX_PAGE_SIZE;

      const data = await ctx.db.query.collections.findMany({
        orderBy: [desc(collections.createdAt)],
        limit: limit,
      });

      // Enhance with post count and latest post image
      const enhancedData = await Promise.all(
        data.map(async (collection) => enhanceCollection(ctx, collection)),
      );

      return enhancedData;
    }),

  getCollectionBySlug: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { slug } = input;

      const collection = await ctx.db.query.collections.findFirst({
        where: eq(collections.slug, slug),
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      return collection;
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

      // Enhance with post count and latest post image
      const enhancedData = await Promise.all(
        data.map(async (collection) => enhanceCollection(ctx, collection)),
      );

      return enhancedData;
    }),

  getPostsInCollection: baseProcedure
    .input(
      z.object({
        collectionSlug: z.string(),
        limit: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        cursor: z.number().optional(), // Page number for offset-based pagination
      }),
    )
    .output(postsInCollectionOutputSchema)
    .query(async ({ ctx, input }) => {
      const { collectionSlug, limit } = input;
      const cursor = input.cursor ?? 1;

      // First, find the collection to get its ID
      const collection = await ctx.db.query.collections.findFirst({
        where: eq(collections.slug, collectionSlug),
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      // Query posts linked to this collection
      const data = await ctx.db.query.posts.findMany({
        where: (posts, { and, eq, exists }) =>
          and(
            eq(posts.visibility, 'public'),
            exists(
              ctx.db
                .select()
                .from(postsToCollections)
                .where(
                  and(
                    eq(postsToCollections.postId, posts.id),
                    eq(postsToCollections.collectionId, collection.id),
                  ),
                ),
            ),
          ),
        orderBy: [desc(posts.createdAt)],
        limit: limit,
        offset: (cursor - 1) * limit,
        with: {
          postsToPhotos: {
            with: {
              photo: true,
            },
            // @ts-expect-error: unspecified any
            orderBy: (postsToPhotos, { asc }) => [asc(postsToPhotos.sortOrder)],
          },
        },
      });

      const hasMore = data.length === limit;
      const nextCursor = hasMore ? cursor + 1 : undefined;

      const [total] = await ctx.db
        .select({ count: count() })
        .from(posts)
        .leftJoin(postsToCollections, eq(posts.id, postsToCollections.postId))
        .where(
          and(
            eq(postsToCollections.collectionId, collection.id),
            eq(posts.visibility, 'public'),
          ),
        );

      const totalPages = Math.ceil(total.count / limit);

      const items = (data as PostWithPhotos[]).map((post) => ({
        ...post,
        coverIndex:
          post.type === 'ALBUM' &&
          post.postsToPhotos &&
          post.postsToPhotos.length > 0
            ? Math.floor(Math.random() * post.postsToPhotos.length)
            : 0,
      }));

      return {
        items,
        nextCursor,
        total: total.count,
        totalPages,
      };
    }),
});
