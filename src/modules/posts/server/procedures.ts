import { z } from 'zod';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { count, desc, eq, ilike, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/constants';
import {
  posts,
  postsInsertSchema,
  postsUpdateSchema,
  postsWithPhotos,
} from '@/db/schema';

import { postsInCollectionOutputSchema } from '@/modules/collections/server/procedures';

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(postsInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const values = input;

      const existingPost = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.slug, values.slug));

      if (existingPost.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Post with this slug already exists',
        });
      }

      const [newPost] = await ctx.db.insert(posts).values(values).returning();

      return newPost;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .delete(posts)
        .where(eq(posts.id, input.id))
        .returning();

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return data;
    }),
  update: protectedProcedure
    .input(postsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const [updatedPost] = await ctx.db
        .update(posts)
        .set({
          ...input,
        })
        .where(eq(posts.id, id))
        .returning();

      if (!updatedPost) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updatedPost;
    }),
  getOne: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.slug, input.slug));

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return data;
    }),
  getPostById: baseProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .output(postsWithPhotos)
    .query(async ({ ctx, input }) => {
      const { postId } = input;

      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, postId),
        with: {
          postsToPhotos: {
            with: {
              photo: true,
            },
            orderBy: (postsToPhotos, { asc }) => [asc(postsToPhotos.sortOrder)],
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return post;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        type: z.enum(['ARTICLE', 'PHOTO', 'ALBUM']).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, type } = input;

      const filters = [];
      if (search) {
        filters.push(ilike(posts.title, `%${search}%`));
      }
      if (type) {
        filters.push(eq(posts.type, type));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const data = await ctx.db
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await ctx.db
        .select({
          count: count(),
        })
        .from(posts)
        .where(whereClause);

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
  getPublished: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        cursor: z.number().nullish(),
      }),
    )
    .output(postsInCollectionOutputSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const cursor = input.cursor ?? 1;

      const data = await ctx.db.query.posts.findMany({
        where: eq(posts.visibility, 'public'),
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
        .select({
          count: count(),
        })
        .from(posts)
        .where(eq(posts.visibility, 'public'));

      const totalPages = Math.ceil(total.count / limit);

      return {
        items: data,
        nextCursor,
        total: total.count,
        totalPages,
      };
    }),
});
