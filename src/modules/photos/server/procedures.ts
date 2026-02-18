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
    .input(photosInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const values = input;

      try {
        const [insertedPhoto] = await ctx.db.transaction(async (tx) => {
          const [photo] = await tx.insert(photos).values(values).returning();

          if (!photo) {
            throw new Error('Failed to insert photo');
          }

          const baseSlug = generateSlug(photo.title);
          const uniqueSlug = `${baseSlug}-${photo.id.slice(0, 8)}`;

          const [post] = await tx
            .insert(posts)
            .values({
              title: photo.title,
              slug: uniqueSlug,
              type: 'PHOTO',
              visibility: photo.visibility,
              coverImage: photo.url,
              description: photo.description,
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

        return insertedPhoto;
      } catch (error) {
        console.error('Photo creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create photo',
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

          // Sync changes to the linked post if it's a PHOTO type post
          // Note: we only sync fields that exist in both schemas
          await tx
            .update(posts)
            .set({
              title: photo.title,
              description: photo.description,
              visibility: photo.visibility,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(posts.type, 'PHOTO'),
                sql`${posts.id} IN (
                  SELECT post_id FROM posts_to_photos WHERE photo_id = ${id}
                )`,
              ),
            );

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
