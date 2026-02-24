import { InferSelectModel, relations, sql } from 'drizzle-orm';
import {
  boolean,
  timestamp,
  pgTable,
  text,
  real,
  varchar,
  integer,
  uuid,
  index,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

// ⌚️ Reusable timestamps - Define once, use everywhere!
export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

/***************
 ****************
 *  User Table  *
 ****************
 ***************/

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

/***************
 ****************
 *  Photo Table *
 ****************
 ***************/

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    title: text('title').notNull(),
    aspectRatio: real('aspect_ratio').notNull(),
    width: real('width').notNull(),
    height: real('height').notNull(),
    blurData: text('blur_data').notNull(),

    make: varchar('make', { length: 255 }),
    model: varchar('model', { length: 255 }),
    lensModel: varchar('lens_model', { length: 255 }),
    focalLength: real('focal_length'),
    focalLength35mm: real('focal_length_35mm'),
    fNumber: real('f_number'),
    iso: integer('iso'),
    exposureTime: real('exposure_time'),
    exposureCompensation: real('exposure_compensation'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    gpsAltitude: real('gps_altitude'),
    dateTimeOriginal: timestamp('datetime_original'),

    ...timestamps,
  },
  (t) => [index('year_idx').on(sql`DATE_TRUNC('year', ${t.dateTimeOriginal})`)],
);

// Schema
export const photosInsertSchema = createInsertSchema(photos).extend({
  title: z.string().min(1, { message: 'Title is required' }),
});
export const photosSelectSchema = createSelectSchema(photos);
export const photosUpdateSchema = createUpdateSchema(photos)
  .extend({
    id: z.string().uuid(),
  })
  .partial()
  .required({ id: true });

// Types
export type Photo = InferSelectModel<typeof photos>;

/*********************
 *********************
 * Collections Table *
 *********************
 *********************/

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  ...timestamps,
});

export type Collection = InferSelectModel<typeof collections>;
export const collectionsInsertSchema = createInsertSchema(collections);
export const collectionsSelectSchema = createSelectSchema(collections);
export const collectionsUpdateSchema = createUpdateSchema(collections);

/***************
 ****************
 *  Post Table  *
 ****************
 ***************/

export const postVisibility = pgEnum('post_visibility', ['public', 'private']);
export const postType = pgEnum('post_type', ['ARTICLE', 'PHOTO', 'ALBUM']);

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    visibility: postVisibility('visibility').default('private').notNull(),
    type: postType('type').notNull(),
    tags: text('tags').array(),
    coverImage: text('cover_image'),
    content: text('content'), // For BLOG posts
    ...timestamps,
  },
  (t) => [index('tags_idx').on(t.tags), index('slug_idx').on(t.slug)],
);

// Types
export type Post = InferSelectModel<typeof posts>;

// Schema
export const postsInsertSchema = createInsertSchema(posts).extend({
  tags: z.array(z.string()).default([]),
});
export const postsSelectSchema = createSelectSchema(posts);
export const postsUpdateSchema = createUpdateSchema(posts);

export const postsWithPhotos = createSelectSchema(posts).extend({
  postsToPhotos: z
    .array(
      z.object({
        photo: createSelectSchema(photos),
      }),
    )
    .optional(),
});
export type PostWithPhotos = z.infer<typeof postsWithPhotos>;

/*******************
 *******************
 * Join Tables *
 *******************
 *******************/

export const postsToCollections = pgTable(
  'posts_to_collections',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.collectionId] }),
  }),
);

export const postsToPhotos = pgTable(
  'posts_to_photos',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.photoId] }),
  }),
);

/*******************
 *******************
 *    Relations    *
 *******************
 *******************/

export const postsRelations = relations(posts, ({ many }) => ({
  postsToCollections: many(postsToCollections),
  postsToPhotos: many(postsToPhotos),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  postsToCollections: many(postsToCollections),
}));

export const photosRelations = relations(photos, ({ many }) => ({
  postsToPhotos: many(postsToPhotos),
}));

export const postsToCollectionsRelations = relations(
  postsToCollections,
  ({ one }) => ({
    collection: one(collections, {
      fields: [postsToCollections.collectionId],
      references: [collections.id],
    }),
    post: one(posts, {
      fields: [postsToCollections.postId],
      references: [posts.id],
    }),
  }),
);

export const postsToPhotosRelations = relations(postsToPhotos, ({ one }) => ({
  photo: one(photos, {
    fields: [postsToPhotos.photoId],
    references: [photos.id],
  }),
  post: one(posts, {
    fields: [postsToPhotos.postId],
    references: [posts.id],
  }),
}));
