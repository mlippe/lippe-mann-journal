import { z } from 'zod';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
  authedProcedure,
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
  photos,
  postsInsertSchema,
  postsUpdateSchema,
  postsWithPhotos,
  postsToPhotos,
  postsToCollections,
  PostWithPhotos,
  collectionsSelectSchema,
} from '@/db/schema';
import { generateSlug } from '@/modules/articles/lib/utils';

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      postsInsertSchema.extend({
        collectionIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { collectionIds, ...values } = input;

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

      return await ctx.db.transaction(async (tx) => {
        const [newPost] = await tx.insert(posts).values(values).returning();

        if (collectionIds && collectionIds.length > 0) {
          await tx.insert(postsToCollections).values(
            collectionIds.map((collectionId) => ({
              postId: newPost.id,
              collectionId,
            })),
          );
        }

        return newPost;
      });
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
    .input(
      postsUpdateSchema.extend({
        collectionIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, collectionIds, ...values } = input;

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      return await ctx.db.transaction(async (tx) => {
        const [updatedPost] = await tx
          .update(posts)
          .set({
            ...values,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, id))
          .returning();

        if (!updatedPost) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        if (collectionIds !== undefined) {
          // Remove existing links
          await tx
            .delete(postsToCollections)
            .where(eq(postsToCollections.postId, id));

          // Insert new links
          if (collectionIds.length > 0) {
            await tx.insert(postsToCollections).values(
              collectionIds.map((collectionId) => ({
                postId: id,
                collectionId,
              })),
            );
          }
        }

        return updatedPost;
      });
    }),
  getOne: authedProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      postsWithPhotos.extend({
        postsToCollections: z
          .array(
            z.object({
              postId: z.string(),
              collectionId: z.string(),
              collection: collectionsSelectSchema,
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(posts.slug, input.slug)];
      if (!ctx.auth) {
        filters.push(eq(posts.visibility, 'public'));
      }

      const post = await ctx.db.query.posts.findFirst({
        where: and(...filters),
        with: {
          postsToPhotos: {
            with: {
              photo: true,
            },
            // @ts-expect-error: unspecified any
            orderBy: (postsToPhotos, { asc }) => [asc(postsToPhotos.sortOrder)],
          },
          postsToCollections: {
            with: {
              collection: true,
            },
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
  getPostById: authedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .output(
      postsWithPhotos.extend({
        postsToCollections: z
          .array(
            z.object({
              postId: z.string(),
              collectionId: z.string(),
              collection: collectionsSelectSchema,
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { postId } = input;

      const filters = [eq(posts.id, postId)];
      if (!ctx.auth) {
        filters.push(eq(posts.visibility, 'public'));
      }

      const post = await ctx.db.query.posts.findFirst({
        where: and(...filters),
        with: {
          postsToPhotos: {
            with: {
              photo: true,
            },
            // @ts-expect-error: unspecified any
            orderBy: (postsToPhotos, { asc }) => [asc(postsToPhotos.sortOrder)],
          },
          postsToCollections: {
            with: {
              collection: true,
            },
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
        type: z.enum(['ARTICLE', 'PHOTO', 'ALBUM', 'SESSION']).nullish(),
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
        cursor: z.number().optional(),
      }),
    )
    .output(
      z.object({
        items: z.array(postsWithPhotos),
        nextCursor: z.number().optional(),
        total: z.number(),
        totalPages: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const cursor = input.cursor ?? 1;

      const offset = (cursor - 1) * limit;

      const data = await ctx.db.query.posts.findMany({
        where: (posts, { eq }) => eq(posts.visibility, 'public'),
        orderBy: (posts, { desc }) => [desc(posts.createdAt), desc(posts.id)],
        limit: limit,
        offset: offset,
        columns: {
          id: true,
          title: true,
          slug: true,
          visibility: true,
          type: true,
          tags: true,
          coverImage: true,
          content: true,
          revisitedNote: true,
          revisitedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          postsToPhotos: {
            columns: {
              postId: true,
              photoId: true,
              sortOrder: true,
              isHighlight: true,
              layoutPosition: true,
              frameNumber: true,
              isInitialPick: true,
              initialOrder: true,
              isRevisitedPick: true,
              revisitedOrder: true,
            },
            with: {
              photo: {
                columns: {
                  id: true,
                  url: true,
                  title: true,
                  aspectRatio: true,
                  width: true,
                  height: true,
                  blurData: true,
                  make: true,
                  model: true,
                  lensModel: true,
                  focalLength: true,
                  focalLength35mm: true,
                  fNumber: true,
                  iso: true,
                  exposureTime: true,
                  exposureCompensation: true,
                  latitude: true,
                  longitude: true,
                  gpsAltitude: true,
                  dateTimeOriginal: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            // @ts-expect-error: unspecified any
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

      const timeSeed = new Date().getUTCMinutes() + new Date().getUTCDate();

      const items = (data as PostWithPhotos[]).map((post) => {
        let coverIndex = 0;
        if (
          post.type === 'ALBUM' &&
          post.postsToPhotos &&
          post.postsToPhotos.length > 0
        ) {
          // Use a combination of the current time seed and the post ID to pick a deterministic index
          const postSeed = post.id
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          coverIndex = (timeSeed + postSeed) % post.postsToPhotos.length;
        }
        return {
          ...post,
          coverIndex,
        };
      });

      return {
        items,
        nextCursor,
        total: total.count,
        totalPages,
      };
    }),
  updateAlbumPhotos: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        photos: z
          .array(
            z.object({
              photoId: z.string().uuid(),
              isHighlight: z.boolean().optional(),
              layoutPosition: z
                .enum(['left', 'right', 'solo'])
                .optional()
                .nullable(),
            }),
          )
          .optional(),
        photoIds: z.array(z.string().uuid()).optional(),
        highlightPhotoIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const photoEntries =
        input.photos ??
        input.photoIds?.map((id) => ({
          photoId: id,
          isHighlight: input.highlightPhotoIds?.includes(id) ?? false,
          layoutPosition: 'solo' as const,
        })) ??
        [];

      await ctx.db.transaction(async (tx) => {
        // Remove existing links
        await tx.delete(postsToPhotos).where(eq(postsToPhotos.postId, postId));

        // Insert new links with correct sort order and highlight status
        if (photoEntries.length > 0) {
          const newLinks = photoEntries.map((entry, index) => ({
            postId,
            photoId: entry.photoId,
            sortOrder: index,
            isHighlight: entry.isHighlight ?? false,
            layoutPosition: entry.layoutPosition ?? 'solo',
          }));
          await tx.insert(postsToPhotos).values(newLinks);
        }
      });

      return { success: true };
    }),
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        content: z.string().optional(),
        visibility: z.enum(['public', 'private']).default('public'),
        tags: z.array(z.string()).default([]),
        collectionIds: z.array(z.string().uuid()).optional(),
        photos: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              url: z.string(),
              title: z.string().optional(),
              width: z.number(),
              height: z.number(),
              aspectRatio: z.number(),
              blurData: z.string(),
              frameNumber: z.number().min(1),
              isInitialPick: z.boolean().default(false),
              initialOrder: z.number().optional().nullable(),
              layoutPosition: z
                .enum(['left', 'right', 'solo'])
                .default('solo')
                .nullable(),
              isHighlight: z.boolean().default(false),
              make: z.string().optional().nullable(),
              model: z.string().optional().nullable(),
              lensModel: z.string().optional().nullable(),
              focalLength: z.number().optional().nullable(),
              focalLength35mm: z.number().optional().nullable(),
              fNumber: z.number().optional().nullable(),
              iso: z.number().optional().nullable(),
              exposureTime: z.number().optional().nullable(),
              exposureCompensation: z.number().optional().nullable(),
              latitude: z.number().optional().nullable(),
              longitude: z.number().optional().nullable(),
              dateTimeOriginal: z.date().optional().nullable(),
            }),
          )
          .min(1, 'A session must contain at least 1 photo'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        title,
        slug: customSlug,
        content,
        visibility,
        tags,
        collectionIds,
        photos: inputPhotos,
      } = input;

      return await ctx.db.transaction(async (tx) => {
        // 1. Prepare photos with deterministic UUIDs
        const preparedPhotos = inputPhotos.map((p) => {
          const id = p.id || crypto.randomUUID();
          return {
            ...p,
            id,
          };
        });

        // 2. Insert into photos table
        const photoRecords = preparedPhotos.map((p) => ({
          id: p.id,
          url: p.url,
          title: p.title || `Frame ${String(p.frameNumber).padStart(2, '0')}`,
          width: p.width,
          height: p.height,
          aspectRatio: p.aspectRatio,
          blurData: p.blurData,
          make: p.make ?? null,
          model: p.model ?? null,
          lensModel: p.lensModel ?? null,
          focalLength: p.focalLength ?? null,
          focalLength35mm: p.focalLength35mm ?? null,
          fNumber: p.fNumber ?? null,
          iso: p.iso ?? null,
          exposureTime: p.exposureTime ?? null,
          exposureCompensation: p.exposureCompensation ?? null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          dateTimeOriginal: p.dateTimeOriginal ?? null,
        }));

        await tx.insert(photos).values(photoRecords);

        // 3. Determine unique slug
        const baseSlug = customSlug?.trim() || generateSlug(title);
        let finalSlug = baseSlug;
        const [existing] = await tx
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.slug, finalSlug));

        if (existing) {
          finalSlug = `${baseSlug}-${preparedPhotos[0].id.slice(0, 4)}`;
        }

        // 4. Determine cover image: first initial pick or first photo
        const initialPick = preparedPhotos.find((p) => p.isInitialPick);
        const coverImageUrl = initialPick ? initialPick.url : preparedPhotos[0].url;

        // 5. Insert post record
        const [newPost] = await tx
          .insert(posts)
          .values({
            title,
            slug: finalSlug,
            type: 'SESSION',
            visibility,
            tags,
            coverImage: coverImageUrl,
            content: content || null,
          })
          .returning();

        // 6. Link photos to session in postsToPhotos
        const links = preparedPhotos.map((p) => ({
          postId: newPost.id,
          photoId: p.id,
          sortOrder: p.frameNumber, // chronological ordering by default
          frameNumber: p.frameNumber,
          isInitialPick: p.isInitialPick,
          initialOrder: p.initialOrder ?? null,
          isRevisitedPick: false,
          revisitedOrder: null,
          layoutPosition: p.layoutPosition ?? 'solo',
          isHighlight: p.isHighlight,
        }));

        await tx.insert(postsToPhotos).values(links);

        // 7. Link collections if any
        if (collectionIds && collectionIds.length > 0) {
          await tx.insert(postsToCollections).values(
            collectionIds.map((collectionId) => ({
              postId: newPost.id,
              collectionId,
            })),
          );
        }

        return newPost;
      });
    }),

  revisitSession: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        revisitedNote: z.string().optional(),
        picks: z
          .array(
            z.object({
              photoId: z.string().uuid(),
              revisitedOrder: z.number().min(0),
              layoutPosition: z
                .enum(['left', 'right', 'solo'])
                .default('solo')
                .nullable(),
              isHighlight: z.boolean().default(false),
            }),
          )
          .min(1, 'Bitte wähle mindestens 1 Foto für die Neuauswahl aus'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, revisitedNote, picks } = input;

      return await ctx.db.transaction(async (tx) => {
        // 1. Update post with revisited metadata
        const [updatedPost] = await tx
          .update(posts)
          .set({
            revisitedNote: revisitedNote?.trim() || null,
            revisitedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId))
          .returning();

        if (!updatedPost) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session post not found',
          });
        }

        // 2. Reset revisited picks for this session
        await tx
          .update(postsToPhotos)
          .set({
            isRevisitedPick: false,
            revisitedOrder: null,
          })
          .where(eq(postsToPhotos.postId, postId));

        // 3. Set the new revisited picks
        for (const pick of picks) {
          await tx
            .update(postsToPhotos)
            .set({
              isRevisitedPick: true,
              revisitedOrder: pick.revisitedOrder,
              layoutPosition: pick.layoutPosition ?? 'solo',
              isHighlight: pick.isHighlight,
            })
            .where(
              and(
                eq(postsToPhotos.postId, postId),
                eq(postsToPhotos.photoId, pick.photoId),
              ),
            );
        }

        return updatedPost;
      });
    }),
});
