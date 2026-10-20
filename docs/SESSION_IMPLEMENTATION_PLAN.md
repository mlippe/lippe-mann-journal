# Implementation Plan: Digital Sessions & Dual-Cut Contact Sheets

## 1. Overview & Core Philosophy

This feature introduces a disciplined, digital-native editorial format called **Sessions**:
- **Constraint & Intention**: Guided by the mental discipline of ~36 frames per outing (photowalks, day trips, gatherings), but **strictly flexible with no hard clamps**. Sessions can contain fewer or more frames (e.g., 15 to 50+) as reality dictates.
- **The Star**: The curated selection (3–7 photos) presented in the existing high-end editorial layout (`EditorialStoryView`).
- **The Dual-Cut Curation**:
  - **Gut Selection (Initial)**: Selected immediately after shooting, capturing the hot instinct of the moment.
  - **Revisited Selection**: Selected weeks or months later with emotional distance. When present, it becomes the primary view.
  - The Gut Selection remains accessible via a subtle toggle so the evolution of seeing is preserved.
- **The Contact Sheet**: All frames from a session are accessible via an interactive darkroom drawer/overlay, without cluttering or degrading the main curated story.
- **Historic Marker Accent System**:
  - In homage to classic contact sheet editing tradition (without cheesy skeuomorphism):
    - **Yellow Marker (`#F59E0B` / Amber)**: Denotes the **Initial Gut Selection** (fast, instinctive first mark).
    - **Red Marker (`#EF4444` / Crimson)**: Denotes the **Revisited Selection** (definitive editorial cut).
    - **Dual Marker**: Frames affirmed in both cuts display a combined indicator.
- **Tone**: Clean, contemporary, digital. No fake-analog nostalgia (no film sprockets, faux grain, or "rolls"). The language is strictly: **Sessions**, **Frames**, **Selections**, and **Contact Sheet**.
- **Performance & Costs**: Leverages existing Cloudflare R2 (zero egress fees) and responsive image thumbnailing (~1.5 MB total payload for all contact sheet thumbnails).

---

## 2. Database & Schema Changes

### File: `src/db/schema.ts`

#### 2.1 Update `postType` Enum
Add `'SESSION'` to the existing `postType` enum:
```typescript
export const postType = pgEnum('post_type', [
  'ARTICLE',
  'PHOTO',
  'ALBUM',
  'SESSION',
]);
```

#### 2.2 Extend `posts` Table
Add optional retrospective curation fields:
```typescript
export const posts = pgTable(
  'posts',
  {
    // ... existing fields ...
    revisitedNote: text('revisited_note'),       // Brief reflection on what changed
    revisitedAt: timestamp('revisited_at'),      // Timestamp when second edit was committed
    // ...
  },
  // ...
);
```

#### 2.3 Extend `postsToPhotos` Join Table
Add sequential frame indexing and dual-cut assignment:
```typescript
export const postsToPhotos = pgTable(
  'posts_to_photos',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),

    // Sequential frame index in the session (1 to N)
    frameNumber: integer('frame_number').notNull().default(1),

    // Initial "Gut" Selection (Historic Yellow Marker)
    isInitialPick: boolean('is_initial_pick').notNull().default(false),
    initialOrder: integer('initial_order'),

    // Cold "Revisited" Selection (Historic Red Marker)
    isRevisitedPick: boolean('is_revisited_pick').notNull().default(false),
    revisitedOrder: integer('revisited_order'),

    // Layout configuration for the active story
    layoutPosition: varchar('layout_position', { length: 20 }).default('solo'),
    isHighlight: boolean('is_highlight').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.photoId] }),
  }),
);
```

#### 2.4 Update Zod Schemas & Types
Ensure `postsWithPhotos` schema in `src/db/schema.ts` includes `frameNumber`, `isInitialPick`, `initialOrder`, `isRevisitedPick`, and `revisitedOrder`.

#### 2.5 Run Drizzle Migration
```bash
bunx drizzle-kit push --config drizzle.config.ts
```

---

## 3. Backend & tRPC Procedures

### File: `src/modules/posts/server/procedures.ts`

#### 3.1 Procedure: `createSession`
Creates the session post, bulk-inserts all uploaded photos, and attaches them with frame numbers and initial curation flags.

**Input Zod Schema (Flexible Frame Count):**
```typescript
z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(), // 1-3 sentences field dispatch
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string()).default([]),
  photos: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      width: z.number(),
      height: z.number(),
      aspectRatio: z.number(),
      blurData: z.string(),
      frameNumber: z.number().min(1),
      isInitialPick: z.boolean(),
      initialOrder: z.number().optional().nullable(),
      layoutPosition: z.enum(['left', 'right', 'solo']).default('solo'),
      isHighlight: z.boolean().default(false),
      // EXIF metadata
      make: z.string().optional().nullable(),
      model: z.string().optional().nullable(),
      lensModel: z.string().optional().nullable(),
      focalLength: z.number().optional().nullable(),
      fNumber: z.number().optional().nullable(),
      iso: z.number().optional().nullable(),
      exposureTime: z.number().optional().nullable(),
      dateTimeOriginal: z.date().optional().nullable(),
    })
  ).min(1, "A session must contain at least 1 frame"),
})
```

**Implementation Steps:**
1. Insert all session photos in a single batch into `photos`.
2. Insert session post into `posts` with `type: 'SESSION'`.
3. Bulk insert into `postsToPhotos` linking all photos with their `frameNumber`, `isInitialPick`, `initialOrder`, and `layoutPosition`.
4. Set `coverImage` to the first initial pick or frame 01.

#### 3.2 Procedure: `revisitSession`
Allows the user to submit their second edit with emotional distance.

**Input Zod Schema:**
```typescript
z.object({
  postId: z.string().uuid(),
  revisitedNote: z.string().optional(),
  picks: z.array(
    z.object({
      photoId: z.string().uuid(),
      revisitedOrder: z.number().min(0),
      layoutPosition: z.enum(['left', 'right', 'solo']).default('solo'),
      isHighlight: z.boolean().default(false),
    })
  ).min(1).max(15),
})
```

**Implementation Steps:**
1. Update `posts` with `revisitedNote` and `revisitedAt = new Date()`.
2. Reset `isRevisitedPick = false` for all photos of this post in `postsToPhotos`.
3. For each picked `photoId`, set `isRevisitedPick = true`, `revisitedOrder`, and `layoutPosition`.

#### 3.3 Ensure `getOne` Returns Session Metadata
In `posts.getOne`, verify that `postsToPhotos` returns `frameNumber`, `isInitialPick`, `initialOrder`, `isRevisitedPick`, and `revisitedOrder`, sorted by `frameNumber ASC` so the contact sheet is always chronological.

---

## 4. Frontend: Public Side Experience

### 4.1 Component: `SessionCutSwitcher`
**Location**: `src/modules/photograph/ui/components/session-cut-switcher.tsx`
- Displayed only when `post.type === 'SESSION'`.
- Renders directly below post title and dispatch.
- **States**:
  - If no Revisited Cut exists yet: Displays a quiet indicator with yellow marker accent:  
    `[ ● Initial Selection (5) ]` (accented with `text-amber-500` / `border-amber-500/30`).
  - If Revisited Cut exists: A smooth segmented pill control:  
    `[ ● Revisited Selection (4) ]   [ ○ Initial Selection (5) ]`  
    - Revisited tab highlights with **editorial red** (`text-red-500` / `border-red-500/30`).
    - Initial tab highlights with **warm amber yellow** (`text-amber-500` / `border-amber-500/30`).
- If `revisitedNote` exists and active cut is `'revisited'`, renders a clean, subtle italicized note:
  > *"Revisited 6 weeks later: Swapped Frame 08 for Frame 14. The morning light in 14 had better geometry."*

---

### 4.2 Component: `ContactSheetDrawer`
**Location**: `src/modules/photograph/ui/components/contact-sheet-drawer.tsx`
- Triggered by a floating bottom dock button or an action button in the metadata header:
  `[ 🎞 Contact Sheet (${totalFrames} Frames) ]`
- Uses Radix Sheet / Drawer with a sleek, dark matte background.

#### Historic Marker Legend (Top of Drawer)
A discreet, elegant color key at the top of the contact sheet:
- `● Initial Gut Pick (Yellow)` — `text-amber-400`
- `● Revisited Selection (Red)` — `text-red-500`
- `◈ Confirmed in Both` — layered red/amber pip

#### Grid Layout
- Desktop: Responsive auto-filling grid (typically 6 columns).
- Mobile: 3 columns.

#### Thumbnails & Historic Marker Badging
- Rendered using Next.js Image with `width={400}` (Cloudflare loader transforms this to ~45 KB WebP).
- Monospace frame index on each thumbnail: `01`, `02`... zero-padded.
- **Marker Color States**:
  1. **Initial Pick only**:
     - Frame has a clean, subtle **yellow/amber ring** (`ring-2 ring-amber-400/80`).
     - Yellow corner badge: `[08 · 1st]`.
  2. **Revisited Pick only**:
     - Frame has a crisp **red ring** (`ring-2 ring-red-500/90`).
     - Red corner badge: `[14 · Rev]`.
  3. **Chosen in Both**:
     - Frame has a confident **red ring with yellow corner accent pip**.
     - Badge: `[04 · Both]`.
  4. **Unselected Frames**:
     - Clean, quiet thumbnail with dimmed frame number (`text-muted-foreground/60`).

#### Interaction
- Clicking any frame in the contact sheet closes the drawer and launches the existing Lightbox focused directly on that frame, displaying full EXIF and frame counter (`Frame 14 of ${totalFrames}`).

---

### 4.3 Integration in `EditorialStoryView`
**Location**: `src/modules/photograph/ui/views/editorial-story-view.tsx`
- Manage local state: `const [selectedCut, setSelectedCut] = useState<'revisited' | 'initial'>(hasRevisitedCut ? 'revisited' : 'initial')`.
- Compute active story photos:
  - If `selectedCut === 'revisited'`: Filter photos where `isRevisitedPick === true`, sorted by `revisitedOrder`.
  - If `selectedCut === 'initial'`: Filter photos where `isInitialPick === true`, sorted by `initialOrder`.
- Pass only these 3–7 curated photos into the existing `EditorialBlock` builder (`hero`, `diptych`, `solo`).
- The main story layout remains 100% focused, distraction-free, and cinematic.

---

## 5. Dashboard: Mobile-First "Session Studio"

### Route: `/dashboard/new/session`

To prevent mobile burnout, split creation into **4 lightweight, sequential screens**:

```
[ Step 1: Upload ] ➔ [ Step 2: Contact Grid ] ➔ [ Step 3: Story Pacing ] ➔ [ Step 4: Dispatch & Save ]
```

#### Step 1: Bulk Upload & Auto-Sort (`SessionUploadStep.tsx`)
1. Button: `Select Session Photos` (Subtext: *"Aim for ~36 frames, upload whatever the session yielded"*).
2. **No arbitrary length clamp**: Accepts any number of files (e.g. 15, 36, 42).
3. **Client-Side EXIF Extraction & Auto-Sequencing**:
   - Parse EXIF `dateTimeOriginal` immediately on the client.
   - Sort images chronologically: frame `01` = earliest shot, frame `N` = latest shot.
4. **Upload Queue**:
   - Concurrency limit of 3 direct uploads to R2 presigned URLs.
   - Screen wake-lock enabled during upload via `navigator.wakeLock.request('screen')`.
   - Clean, compact progress bar: `Uploading session... 14/${totalFiles}`.
   - Instant local preview URLs (`URL.createObjectURL`) so the user can begin curating without waiting for the upload to finish.

#### Step 2: The Contact Grid (The Gut Selection) (`SessionGridStep.tsx`)
- High-density 3-column grid on mobile (6-column on tablet/desktop).
- Monospace frame labels: `01` to `N`.
- **Interactions**:
  - **Tap**: Toggle as Gut Pick. Selected frames get the **Yellow Marker accent ring & badge**: `[✓1]`, `[✓2]`...
  - **Press-and-Hold / Loupe**: Long-pressing opens an instant full-screen preview.
  - Floating sticky bottom pill: `Selected: 4 frames ➔ Continue`.

#### Step 3: Story Pacing (Picks Only) (`SessionPacingStep.tsx`)
- **Crucial Rule**: Only show the 4–6 selected frames on this screen. Never show all frames.
- Vertical drag-to-reorder list for the picked frames.
- 1-tap layout toggles:
  - `Hero` (full width anchor)
  - `Diptych` (pair with adjacent frame)
  - `Solo` (standard editorial breathing room)

#### Step 4: Dispatch & Publish (`SessionPublishStep.tsx`)
- Title field (e.g., *"Isarauen im Herbstlicht"*).
- Field Dispatch textarea (1–3 sentences).
- Tags / Collections selection.
- One-tap button: **Publish Session**.

---

### Route: Revisit Flow (`/dashboard/posts/[id]/revisit`)

1. Accessible from dashboard via a list of eligible sessions (posts older than 30 days without a revisited cut).
2. Opens directly to the Contact Grid.
3. Frames from the **Initial Cut** are outlined with their **Yellow Marker rings**.
4. User taps to select the **Revisited Cut** (which highlight with **Red Marker rings**).
5. User provides an optional 1–2 sentence reflection note (`revisitedNote`).
6. One-tap button: **Commit Revisited Cut**.

---

## 6. Implementation Checklist & Order of Execution

### Phase 1: Database & Procedures
- [ ] Add `'SESSION'` to `postType` enum in `src/db/schema.ts`.
- [ ] Add `revisitedNote` and `revisitedAt` to `posts` table.
- [ ] Add `frameNumber`, `isInitialPick`, `initialOrder`, `isRevisitedPick`, `revisitedOrder` to `postsToPhotos`.
- [ ] Push schema with `bunx drizzle-kit push`.
- [ ] Implement `posts.createSession` in `src/modules/posts/server/procedures.ts` with variable photo count.
- [ ] Implement `posts.revisitSession` in `src/modules/posts/server/procedures.ts`.
- [ ] Update `posts.getOne` to return frame numbers and cut indicators.

### Phase 2: Public Frontend Components
- [ ] Build `SessionCutSwitcher` (`src/modules/photograph/ui/components/session-cut-switcher.tsx`) with yellow/red cut styling.
- [ ] Build `ContactSheetDrawer` (`src/modules/photograph/ui/components/contact-sheet-drawer.tsx`) with historic yellow (gut) and red (revisited) marker rings and color legend.
- [ ] Update `EditorialStoryView` (`src/modules/photograph/ui/views/editorial-story-view.tsx`) to filter photos by active cut (`revisited` vs `initial`) when `post.type === 'SESSION'`.
- [ ] Add drawer trigger to the editorial header/bottom dock (`Contact Sheet (N Frames)`).
- [ ] Ensure Lightbox correctly opens any frame clicked inside the contact sheet with frame `X of N`.

### Phase 3: Dashboard Session Studio
- [ ] Add "+ Session" entry card in `/dashboard/new` (`NewPostView`).
- [ ] Create `/dashboard/new/session/page.tsx` with multi-step stepper.
- [ ] Build Step 1: Bulk upload with EXIF capture time auto-sorting (no fixed 36 limit).
- [ ] Build Step 2: 3-column contact grid with yellow marker pick badges and preview loupe.
- [ ] Build Step 3: Story pacing manager (picks only, diptych pairing).
- [ ] Build Step 4: Dispatch note & publish trigger.

### Phase 4: Revisit Action
- [ ] Add "Revisit" button on session cards in `/dashboard/posts`.
- [ ] Build `/dashboard/posts/[id]/revisit/page.tsx` showing existing yellow gut picks and allowing red revisited picks.
- [ ] Hook up `posts.revisitSession` mutation and verify public state updates.

---

## 7. Verification & Edge Cases

1. **Flexible Frame Counts**:
   - Verify that sessions with 18, 36, or 48 frames work seamlessly without schema or validation errors.
2. **Color Contrast & Polish**:
   - Ensure yellow (`#F59E0B`) and red (`#EF4444`) rings/badges have proper contrast in both light and dark themes.
3. **Mobile Safari Memory Safeguard**:
   - In the dashboard contact grid, load thumbnail previews or downscaled canvas blobs, not full 24MP images simultaneously.
4. **Missing Capture Time Fallback**:
   - If EXIF `dateTimeOriginal` is missing from an image, fall back to file last modified date or upload order.
5. **Cloudflare Cache & Zero Egress**:
   - Verify that contact sheet thumbnails use the CDN URL pattern (`/cdn-cgi/image/width=400,...`) to ensure zero egress bandwidth consumption.
