# Implementation Specification: Brevo Newsletter Integration

This document provides a detailed specification for implementing a newsletter notification system using Brevo.

## 1. Environment Configuration
Add the following to `.env` and `.env.example`:
- `BREVO_API_KEY`: Your Brevo API Key (v3).
- `BREVO_LIST_ID`: The ID of the mailing list where subscribers will be added.
- `BREVO_TEMPLATE_ID`: The ID of the transactional email template for new posts.
- `NEXT_PUBLIC_APP_URL`: The base URL of the application (e.g., https://journal.lippe-mann.work).

## 2. Database Schema Update (`src/db/schema.ts`)
Add a `description` column to the `posts` table to store teaser text for the newsletter.
```typescript
export const posts = pgTable('posts', {
  // ... existing columns
  description: text('description'), // New teaser/newsletter text
  ...timestamps,
});
```
Apply via: `bun db:push`

## 3. Brevo Utility Class (`src/lib/brevo.ts`)
Create a utility to interact with Brevo API v3.
- **Endpoint:** `https://api.brevo.com/v3/`
- **Method `subscribe(email: string)`:**
  - Use `POST /contacts` or the Double Opt-in specific endpoint if configured.
  - Required Header: `api-key: process.env.BREVO_API_KEY`.
- **Method `sendNotification(params)`:**
  - Use `POST /smtp/email`.
  - Pass `templateId`, `to` (list members or individual for testing), and `params` (title, description, coverImage, url).

## 4. Backend (TRPC) Logic
### Newsletter Router (`src/modules/newsletter/server/procedures.ts`)
- New procedure `subscribe`:
  - Input: `z.object({ email: z.string().email() })`.
  - Logic: Calls `brevo.subscribe(email)`.

### Posts Router (`src/modules/posts/server/procedures.ts`)
- Update `create` input schema to include `sendNotification: z.boolean().default(true)`.
- In the `create` mutation, after successfully inserting a **public** post:
  - If `input.sendNotification` is true:
    - Construct the absolute URL: `${process.env.NEXT_PUBLIC_APP_URL}/posts/${newPost.slug}`.
    - Resolve the `coverImage` URL using `keyToUrl` or `getOptimizedImageUrl`.
    - Trigger `brevo.sendNotification` with `title`, `description`, `coverImage`, and `url`.

## 5. Dashboard UI Modifications
### Article Form (`src/modules/articles/ui/components/article-form.tsx`)
- Add a `Textarea` for `description`.
- Add a `Switch` (with a "Notify Subscribers" label) for `sendNotification`.
- Default `sendNotification` to `true`.

### Photo Confirmation (`src/modules/photos/ui/components/create-single-photo/confirm-step.tsx`)
- Add the same `description` (or use post title as fallback) and `sendNotification` toggle.

## 6. Public UI Component
### Newsletter Signup (`src/modules/home/ui/components/newsletter-signup.tsx`)
- A visually appealing card (matching the theme).
- Input field for email + "Subscribe" button.
- Success message: "Check your inbox to confirm your subscription."
- Integrate into `src/modules/home/ui/views/infinite-feed-view.tsx`:
  - Insert the component into the `posts` array after index 2 (between 3rd and 4th post).

## 7. Brevo Template Setup (Reference)
The Brevo template should use these variables:
- `{{ params.title }}`: The post title.
- `{{ params.description }}`: The teaser text.
- `{{ params.coverImage }}`: Absolute URL of the cover image.
- `{{ params.url }}`: Absolute link to the post.
