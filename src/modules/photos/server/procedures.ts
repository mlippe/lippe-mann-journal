import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { and, eq, desc, asc, sql, ilike, count } from 'drizzle-orm';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/constants';
import {
  photos,
  photosUpdateSchema,
  photosInsertSchema,
  posts,
  postsToPhotos,
} from '@/db/schema';
import { TRPCError } from '@trpc/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/modules/s3/lib/server-client';
import { generateSlug } from '@/modules/articles/lib/utils';

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export const photosRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        ...photosInsertSchema.shape,
        postTitle: z.string(),
        postVisibility: z.enum(['public', 'private']).default('private'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postTitle, postVisibility, ...photoData } = input;

      try {
        const [result] = await ctx.db.transaction(async (tx) => {
          const [photo] = await tx.insert(photos).values(photoData).returning();

          if (!photo) {
            throw new Error('Failed to insert photo');
          }

          const baseSlug = generateSlug(postTitle);
          const uniqueSlug = `${baseSlug}-${photo.id.slice(0, 4)}`;

          const [post] = await tx
            .insert(posts)
            .values({
              title: postTitle,
              slug: uniqueSlug,
              type: 'PHOTO',
              visibility: postVisibility,
              coverImage: photo.url,
            })
            .returning();

          if (!post) {
            throw new Error('Failed to insert post');
          }

          await tx.insert(postsToPhotos).values({
            postId: post.id,
            photoId: photo.id,
            sortOrder: 0,
          });

          return [photo];
        });

        return result;
      } catch (error) {
        console.error('Photo creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create photo',
        });
      }
    }),

  createAlbum: protectedProcedure
    .input(
      z.object({
        postTitle: z.string(),
        postVisibility: z.enum(['public', 'private']).default('private'),
        photos: z.array(photosInsertSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [albumPost] = await ctx.db.transaction(async (tx) => {
          // 1. Insert all photos
          const insertedPhotos = await tx
            .insert(photos)
            .values(input.photos)
            .returning();

          if (insertedPhotos.length === 0) {
            throw new Error('Failed to insert photos for album');
          }

          // 2. Create the album post
          const baseSlug = generateSlug(input.postTitle);
          const uniqueSlug = `album-${baseSlug}-${insertedPhotos[0].id.slice(0, 4)}`;

          const [post] = await tx
            .insert(posts)
            .values({
              title: input.postTitle,
              slug: uniqueSlug,
              type: 'ALBUM',
              visibility: input.postVisibility,
              coverImage: insertedPhotos[0].url,
            })
            .returning();

          if (!post) {
            throw new Error('Failed to create album post');
          }

          // 3. Link photos to album post
          const links = insertedPhotos.map((photo, index) => ({
            postId: post.id,
            photoId: photo.id,
            sortOrder: index,
          }));

          await tx.insert(postsToPhotos).values(links);

          return [post];
        });

        return albumPost;
      } catch (error) {
        console.error('Album creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create album',
        });
      }
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      try {
        const [photo] = await ctx.db
          .select()
          .from(photos)
          .where(eq(photos.id, id));

        if (!photo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Photo not found',
          });
        }

        await ctx.db.transaction(async (tx) => {
          // Find and delete posts associated with this photo that are of type 'PHOTO'
          // Other posts (like ALBUMs) might still need to exist even if one photo is deleted.
          const linkedPosts = await tx
            .select({ id: posts.id })
            .from(posts)
            .innerJoin(postsToPhotos, eq(posts.id, postsToPhotos.postId))
            .where(and(eq(postsToPhotos.photoId, id), eq(posts.type, 'PHOTO')));

          if (linkedPosts.length > 0) {
            await tx.delete(posts).where(
              sql`${posts.id} IN (${sql.join(
                linkedPosts.map((p) => p.id),
                sql`, `,
              )})`,
            );
          }

          // Delete photo record (join table records are deleted by DB cascade)
          await tx.delete(photos).where(eq(photos.id, id));
        });

        // S3 delete after DB — orphan file is acceptable, inconsistent DB is not
        try {
          const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: photo.url,
          });
          await s3Client.send(command);
        } catch (error) {
          console.error('S3 delete failed (orphan file):', error);
        }

        return photo;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Photo deletion error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete photo',
        });
      }
    }),
  update: protectedProcedure
    .input(photosUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      try {
        const [updatedPhoto] = await ctx.db.transaction(async (tx) => {
          const [photo] = await tx
            .update(photos)
            .set({
              ...input,
              updatedAt: new Date(),
            })
            .where(eq(photos.id, id))
            .returning();

          if (!photo) {
            throw new TRPCError({ code: 'NOT_FOUND' });
          }

          return [photo];
        });

        return updatedPhoto;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Photo update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update photo',
        });
      }
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const [photo] = await ctx.db
        .select()
        .from(photos)
        .where(eq(photos.id, id));

      return photo;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        orderBy: z.enum(['asc', 'desc'] as const).default('desc'),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, orderBy } = input;

      const data = await ctx.db
        .select()
        .from(photos)
        .where(
          search ? ilike(photos.title, `%${escapeLike(search)}%`) : undefined,
        )
        .orderBy(
          orderBy === 'asc'
            ? asc(photos.dateTimeOriginal)
            : desc(photos.dateTimeOriginal),
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await ctx.db
        .select({
          count: count(),
        })
        .from(photos)
        .where(
          search ? ilike(photos.title, `%${escapeLike(search)}%`) : undefined,
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
