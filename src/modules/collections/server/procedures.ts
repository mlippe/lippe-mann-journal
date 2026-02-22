import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { desc, count, eq, and, exists } from "drizzle-orm"; // Added 'exists'
import { collections, posts, postsWithPhotos, postsToCollections } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import {
  DEFAULT_PAGE_SIZE, // DEFAULT_PAGE not used here
  MAX_PAGE_SIZE,
} from "@/constants";

// Zod schema for the output of getPostsInCollection
export const postsInCollectionOutputSchema = z.object({
  items: z.array(postsWithPhotos),
  nextCursor: z.number().optional(),
  total: z.number(),
  totalPages: z.number(),
});

export const collectionsRouter = createTRPCRouter({
  getAllCollections: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).default(MAX_PAGE_SIZE), // Default to max size for listing all
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? MAX_PAGE_SIZE;
      const data = await ctx.db.query.collections.findMany({
        orderBy: [desc(collections.createdAt)],
        limit: limit,
      });
      return data;
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
          code: "NOT_FOUND",
          message: "Collection not found",
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

      return data;
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
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      // Query posts linked to this collection
      const data = await ctx.db.query.posts.findMany({
        where: and(
          eq(posts.visibility, 'public'),
          exists(
            ctx.db.select().from(postsToCollections).where(
              and(
                eq(postsToCollections.postId, posts.id),
                eq(postsToCollections.collectionId, collection.id)
              )
            )
          )
        ),
        orderBy: [desc(posts.createdAt)],
        limit: limit,
        offset: (cursor - 1) * limit,
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
        .select({ count: count() })
        .from(posts)
        .leftJoin(postsToCollections, eq(posts.id, postsToCollections.postId))
        .where(and(
          eq(postsToCollections.collectionId, collection.id),
          eq(posts.visibility, 'public')
        ));


      const totalPages = Math.ceil(total.count / limit);

      return {
        items: data,
        nextCursor,
        total: total.count,
        totalPages,
      };
    }),
});
