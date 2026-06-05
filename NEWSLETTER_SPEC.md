# Implementation Specification: Brevo Newsletter Integration

> **Status:** Draft · journal.lippe-mann.de  
> **Stack:** Next.js · Neon DB · tRPC · Brevo API v3

---

## Overview

This document specifies the full implementation of a newsletter notification system for the personal photo journal. The goal is a lightweight, personal-feeling subscriber loop — not a marketing funnel. Emails should read like they came from a friend, not a brand.

**Core flow:**

```
Visitor sees signup in feed
  → submits email
    → Brevo sends double opt-in confirmation
      → subscriber clicks confirm → lands on /?subscribed=true
        → homepage shows confirmation toast
          → new post published
            → Brevo sends notification email to list
```

---

## 1. Environment Configuration

Add the following to `.env` and `.env.example`:

```env
BREVO_API_KEY=                # Brevo API Key (v3), found in Settings → API Keys
BREVO_LIST_ID=                # ID of the mailing list (numeric, found in Contacts → Lists)
BREVO_TEMPLATE_ID=            # ID of the transactional email template for new posts
BREVO_DOI_TEMPLATE_ID=        # ID of the double opt-in confirmation email template
BREVO_TEST_EMAIL=             # Your own email address for test sends
NEXT_PUBLIC_APP_URL=          # Base URL, e.g. https://journal.lippe-mann.de
SUBSCRIBE_RATE_LIMIT_SECRET=  # Random string, used to namespace the rate limit store
```

> **Note:** `BREVO_LIST_ID` is a number, not a string. Cast it with `Number(process.env.BREVO_LIST_ID)` when passing to the API.

---

## 2. Database Schema Update

**File:** `src/db/schema.ts`

Add a `description` column to the `posts` table. This serves double duty:

- **Newsletter teaser** — the short text sent in the notification email
- **SEO meta description** — use as `<meta name="description">` on the post page, avoiding the need for a separate field

```typescript
export const posts = pgTable('posts', {
  // ... existing columns
  description: text('description'), // teaser text — used for newsletter + meta description
  ...timestamps,
});
```

Apply the migration:

```bash
bun db:push
```

---

## 3. Brevo Utility (`src/lib/brevo.ts`)

Centralised wrapper for all Brevo API v3 interactions. Handles subscribe, notify, duplicate detection, and test sends.

```typescript
const BREVO_BASE = 'https://api.brevo.com/v3';

const brevoHeaders = {
  'api-key': process.env.BREVO_API_KEY!,
  'Content-Type': 'application/json',
};

// Typed error codes returned by Brevo
export type BrevoErrorCode = 'DUPLICATE' | 'INVALID_EMAIL' | 'UNKNOWN';

export class BrevoError extends Error {
  constructor(
    public code: BrevoErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function parseBrevoError(body: any): BrevoErrorCode {
  const msg: string = body?.message ?? '';
  if (msg.toLowerCase().includes('contact already exist')) return 'DUPLICATE';
  if (msg.toLowerCase().includes('invalid')) return 'INVALID_EMAIL';
  return 'UNKNOWN';
}

export const brevo = {
  /**
   * Add a contact with double opt-in.
   * Brevo sends the confirmation email automatically using BREVO_DOI_TEMPLATE_ID.
   * Throws BrevoError with code 'DUPLICATE' if already subscribed.
   */
  async subscribe(email: string) {
    const res = await fetch(`${BREVO_BASE}/contacts/doubleOptinConfirmation`, {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify({
        email,
        includeListIds: [Number(process.env.BREVO_LIST_ID)],
        templateId: Number(process.env.BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=true`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new BrevoError(parseBrevoError(err), JSON.stringify(err));
    }
  },

  /**
   * Send a post notification to all confirmed subscribers via a Brevo template.
   * Pass testEmail to send only to yourself — use before blasting the full list.
   */
  async sendNotification(
    params: {
      title: string;
      description: string;
      coverImage: string;
      url: string;
    },
    options: { testEmail?: string } = {},
  ) {
    const recipient = options.testEmail
      ? [{ email: options.testEmail }]
      : undefined; // undefined = Brevo sends to the list configured in the template

    const body: Record<string, unknown> = {
      templateId: Number(process.env.BREVO_TEMPLATE_ID),
      params,
    };

    if (recipient) {
      body.to = recipient;
    } else {
      // Target the full list
      body.messageVersions = [
        {
          to: [{ email: 'list' }],
          params,
        },
      ];
    }

    const res = await fetch(`${BREVO_BASE}/smtp/email`, {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Brevo sendNotification failed: ${JSON.stringify(err)}`);
    }
  },

  /**
   * Get the current subscriber count for the configured list.
   * Used to display social proof near the signup form.
   */
  async getSubscriberCount(): Promise<number> {
    const res = await fetch(
      `${BREVO_BASE}/contacts/lists/${process.env.BREVO_LIST_ID}`,
      { headers: brevoHeaders },
    );

    if (!res.ok) return 0; // fail silently — this is cosmetic

    const data = await res.json();
    return data.uniqueSubscribers ?? 0;
  },
};
```

> **Alternative for sending to a list:** Use the Brevo Campaigns API (`POST /emailCampaigns`) if you want full campaign tracking (open rates, clicks). The transactional approach above is simpler but has less analytics.

---

## 4. Rate Limiting (`src/lib/rate-limit.ts`)

The subscribe endpoint is publicly callable with no authentication. Without rate limiting, it is trivially spammable — both your Brevo free quota (300/day) and your list quality suffer.

Use an in-memory rate limiter backed by a simple sliding window. For a personal journal on Vercel's serverless functions, this is sufficient. If you need persistence across cold starts, swap the store for a Neon or Upstash Redis table.

```typescript
// src/lib/rate-limit.ts

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

// In-memory store — resets on cold start, fine for low-traffic personal site
const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3; // max 3 subscribe attempts per IP per hour

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: new Date(now + WINDOW_MS),
    };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.windowStart + WINDOW_MS),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: new Date(entry.windowStart + WINDOW_MS),
  };
}
```

Usage in the tRPC router (see section 5a) — the identifier is the caller's IP address, read from the request headers Vercel injects.

---

## 5. Backend (tRPC) Logic

### 5a. Newsletter Router

**File:** `src/modules/newsletter/server/procedures.ts`

Includes rate limiting, duplicate subscriber handling, test send support, and subscriber count query.

```typescript
import { z } from 'zod';
import {
  publicProcedure,
  protectedProcedure,
  createTRPCRouter,
} from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { brevo, BrevoError } from '@/lib/brevo';
import { checkRateLimit } from '@/lib/rate-limit';

export const newsletterRouter = createTRPCRouter({
  /**
   * Public: subscribe with email.
   * Rate limited to 3 attempts per IP per hour.
   * Handles duplicate subscribers gracefully.
   */
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Get IP from Vercel-injected headers (works in Next.js App Router)
      const ip =
        ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ctx.headers?.get('x-real-ip') ??
        'unknown';

      const limit = checkRateLimit(`subscribe:${ip}`);

      if (!limit.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Zu viele Versuche. Bitte warte bis ${limit.resetAt.toLocaleTimeString('de-DE')}.`,
        });
      }

      try {
        await brevo.subscribe(input.email);
        return { success: true, status: 'pending_confirmation' as const };
      } catch (err) {
        if (err instanceof BrevoError && err.code === 'DUPLICATE') {
          // Don't expose whether this email is on the list (privacy)
          // Return success — the user already confirmed, no harm done
          return { success: true, status: 'already_subscribed' as const };
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Subscription failed',
        });
      }
    }),

  /**
   * Protected (admin only): send a test notification email to yourself.
   * Call this from the dashboard before triggering a real send.
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        coverImage: z.string().url(),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const testEmail = process.env.BREVO_TEST_EMAIL;
      if (!testEmail)
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'BREVO_TEST_EMAIL not set',
        });

      await brevo.sendNotification(input, { testEmail });
      return { success: true };
    }),

  /**
   * Public: get subscriber count for social proof display.
   * Cached at the component level — no need for server-side caching at this scale.
   */
  getSubscriberCount: publicProcedure.query(async () => {
    const count = await brevo.getSubscriberCount();
    return { count };
  }),
});
```

### 5b. Posts Router — notify on publish

**File:** `src/modules/posts/server/procedures.ts`

Update the `create` mutation input schema:

```typescript
.input(
  z.object({
    // ... existing fields
    description: z.string().max(160).optional(),
    sendNotification: z.boolean().default(true), // see UX note below
  })
)
```

After a successful insert of a **public** post:

```typescript
if (input.sendNotification && newPost.visibility === 'public') {
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/posts/${newPost.slug}`;
  const coverImage = getOptimizedImageUrl(newPost.coverImageKey); // or keyToUrl()

  // Fire-and-forget — don't block the create response on email delivery
  brevo
    .sendNotification({
      title: newPost.title,
      description: input.description ?? newPost.title,
      coverImage,
      url: postUrl,
    })
    .catch((err) => console.error('Brevo notification failed:', err));
}
```

> **UX note on `sendNotification` defaults:**  
> Default `true` for **articles** — intentional, infrequent posts worth notifying.  
> Default `false` for **photos** — posting 5 photos in a week will cause unsubscribes fast.  
> Consider a future "digest mode" where photo posts batch into a weekly summary.

---

## 6. Confirmed Subscription Landing (`?subscribed=true`)

When a subscriber clicks the confirmation link in the DOI email, Brevo redirects them to `/?subscribed=true`. Without handling this param, they land silently on the homepage with no feedback. This is the moment of highest positive intent — don't waste it.

### 6a. Homepage reads the param and shows a toast

**File:** `src/modules/home/ui/views/infinite-feed-view.tsx` (or your root layout)

```tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner'; // or your existing toast library

export function SubscribedToast() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (params.get('subscribed') === 'true') {
      toast.success('Du bist dabei 👋', {
        description:
          'Ab jetzt kriegst du einen kurzen Hinweis wenn ich was Neues poste.',
        duration: 6000,
      });

      // Clean up the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('subscribed');
      router.replace(url.pathname, { scroll: false });
    }
  }, [params, router]);

  return null;
}
```

Mount this once at the top of the homepage or root layout:

```tsx
// in your homepage or layout
<SubscribedToast />
```

### 6b. Also set the localStorage flag on confirmation

The signup card uses `localStorage` to hide itself once the user has interacted. But if they submitted the form, closed the tab, then confirmed via email later — the flag was never set. Fix this in `SubscribedToast`:

```tsx
useEffect(() => {
  if (params.get('subscribed') === 'true') {
    localStorage.setItem('newsletter_dismissed', 'true'); // hide signup card
    // ... rest of toast logic
  }
}, [params]);
```

---

## 7. Dashboard UI

### 7a. Article Form

**File:** `src/modules/articles/ui/components/article-form.tsx`

```tsx
{/* Newsletter teaser — also used as meta description */}
<Textarea
  label="Teaser / Beschreibung"
  placeholder="Ein Satz der neugierig macht — wird im Newsletter und als Meta-Description verwendet."
  {...register('description')}
  maxLength={160}
/>
<p className="text-xs text-muted-foreground mt-1">
  Max. 160 Zeichen — passt auch als Meta-Description.
</p>

{/* Test send button — only visible when description is filled */}
{watch('description') && (
  <button
    type="button"
    onClick={() => sendTestNotification.mutate({
      title: watch('title'),
      description: watch('description'),
      coverImage: watch('coverImageUrl'),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/posts/${watch('slug')}`,
    })}
    className="text-sm text-muted-foreground underline underline-offset-4"
  >
    Test-Mail an mich senden
  </button>
)}

{/* Notification toggle */}
<div className="flex items-center gap-3">
  <Switch id="sendNotification" {...register('sendNotification')} defaultChecked />
  <label htmlFor="sendNotification" className="text-sm text-muted-foreground">
    Abonnenten benachrichtigen
  </label>
</div>
```

Wire up the test send mutation:

```tsx
const sendTestNotification = trpc.newsletter.sendTestNotification.useMutation({
  onSuccess: () => toast.success('Test-Mail gesendet — check dein Postfach.'),
  onError: () => toast.error('Hat nicht geklappt.'),
});
```

### 7b. Photo Confirm Step

**File:** `src/modules/photos/ui/components/create-single-photo/confirm-step.tsx`

```tsx
<Textarea
  label="Kurze Beschreibung (optional)"
  placeholder="Was ist das für ein Moment?"
  {...register('description')}
/>

<div className="flex items-center gap-3">
  <Switch id="sendNotification" {...register('sendNotification')} defaultChecked={false} />
  <label htmlFor="sendNotification" className="text-sm text-muted-foreground">
    Abonnenten benachrichtigen
  </label>
</div>
```

> Default is `false` for photos — see note in section 5b.

---

## 8. Public Signup Component

**File:** `src/modules/home/ui/components/newsletter-signup.tsx`

Includes subscriber count for social proof, localStorage dismiss flag, duplicate-aware success messaging, and rate limit error handling.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/trpc/client';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<
    'idle' | 'loading' | 'success' | 'duplicate' | 'rate_limited' | 'error'
  >('idle');
  const [dismissed, setDismissed] = useState(true); // default hidden until localStorage check

  const { data: countData } = trpc.newsletter.getSubscriberCount.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 10, // cache for 10 minutes — cosmetic data, no need to refresh often
    },
  );

  useEffect(() => {
    const isDismissed = localStorage.getItem('newsletter_dismissed') === 'true';
    if (!isDismissed) setDismissed(false);
  }, []);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.status === 'already_subscribed') {
        setState('duplicate');
      } else {
        setState('success');
      }
      localStorage.setItem('newsletter_dismissed', 'true');
    },
    onError: (err) => {
      if (err.data?.code === 'TOO_MANY_REQUESTS') {
        setState('rate_limited');
      } else {
        setState('error');
      }
    },
  });

  if (dismissed) return null;

  const subscriberCount = countData?.count ?? 0;

  return (
    <div className='relative rounded-xl border border-border bg-card p-6'>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem('newsletter_dismissed', 'true');
        }}
        className='absolute right-4 top-4 text-muted-foreground hover:text-foreground'
        aria-label='Schließen'
      >
        ×
      </button>

      {state === 'success' && (
        <div>
          <p className='font-medium'>Fast da —</p>
          <p className='text-muted-foreground text-sm mt-1'>
            Check kurz dein Postfach und bestätige einmal. Dauert 10 Sekunden.
          </p>
        </div>
      )}

      {state === 'duplicate' && (
        <div>
          <p className='font-medium'>Du bist schon dabei.</p>
          <p className='text-muted-foreground text-sm mt-1'>
            Diese Adresse ist bereits eingetragen — du bekommst schon Updates.
          </p>
        </div>
      )}

      {state === 'rate_limited' && (
        <div>
          <p className='font-medium'>Kurz durchatmen.</p>
          <p className='text-muted-foreground text-sm mt-1'>
            Zu viele Versuche — versuch's in einer Stunde nochmal.
          </p>
        </div>
      )}

      {(state === 'idle' || state === 'loading' || state === 'error') && (
        <>
          <p className='font-medium'>Neue Posts direkt zu dir.</p>
          <p className='text-muted-foreground text-sm mt-1 mb-4'>
            Kein Algorithmus, kein Lärm — nur ein kurzes Update wenn ich was
            Neues poste.
          </p>

          {/* Social proof — only shown when count > 0 */}
          {subscriberCount > 0 && (
            <p className='text-xs text-muted-foreground mb-3'>
              {subscriberCount} {subscriberCount === 1 ? 'Leser' : 'Leser'}{' '}
              dabei.
            </p>
          )}

          <div className='flex gap-2'>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='deine@email.de'
              className='flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && email) {
                  setState('loading');
                  subscribe.mutate({ email });
                }
              }}
            />
            <button
              onClick={() => {
                if (!email) return;
                setState('loading');
                subscribe.mutate({ email });
              }}
              disabled={state === 'loading' || !email}
              className='rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50'
            >
              {state === 'loading' ? '...' : 'Dabei sein'}
            </button>
          </div>

          {state === 'error' && (
            <p className='text-destructive text-xs mt-2'>
              Hat nicht geklappt — versuch's nochmal.
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

### Placement in feed

**File:** `src/modules/home/ui/views/infinite-feed-view.tsx`

```tsx
{
  posts.map((post, i) => (
    <>
      <PostCard key={post.id} post={post} />
      {i === 2 && <NewsletterSignup key='newsletter-signup' />}
    </>
  ));
}
```

> **UX rationale:** After 3 posts the visitor has seen what the journal actually is. They're subscribing to something they've already experienced, not a promise.

---

## 9. Brevo Template Setup

### Template variables

| Variable                   | Content                       |
| -------------------------- | ----------------------------- |
| `{{ params.title }}`       | Post title                    |
| `{{ params.description }}` | Teaser text (fallback: title) |
| `{{ params.coverImage }}`  | Absolute URL of cover image   |
| `{{ params.url }}`         | Absolute link to the post     |

### Template design principles

Resist the drag-and-drop builder. Write the template HTML by hand or use Brevo's minimal base. The goal is an email that reads like it came from a person:

- No header banner or logo block
- No `Monthly Digest #12` subject lines
- Single image, single link, done
- Footer: unsubscribe link only — no social icons, no address block beyond what's legally required

### Recommended email HTML structure

```html
<p>Hey,</p>

<p>{{ params.description }}</p>

<a href="{{ params.url }}">
  <img
    src="{{ params.coverImage }}"
    alt="{{ params.title }}"
    style="max-width:100%;border-radius:8px;"
  />
</a>

<p><a href="{{ params.url }}">Ansehen →</a></p>

<p>Manu</p>

<p style="font-size:12px;color:#999;">
  <a href="{{ unsubscribeLink }}">Abmelden</a> · keine Antwort nötig, ich les
  aber trotzdem mit 👋
</p>
```

### Test send workflow

Before triggering a notification to the full list, always test first:

1. Fill in the article form with title, description, cover image
2. Click **"Test-Mail an mich senden"** — this calls `sendTestNotification` and delivers to `BREVO_TEST_EMAIL`
3. Check the email on mobile and desktop
4. Confirm image loads, link works, unsubscribe link is present
5. Only then publish with **"Abonnenten benachrichtigen"** toggled on

---

## 10. German Copywriting

All copy is written in the voice of Manu — personal, direct, no newsletter-speak.

### Signup card (inline in feed)

| Element           | Copy                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| Headline          | Neue Posts direkt zu dir.                                                     |
| Subline           | Kein Algorithmus, kein Lärm — nur ein kurzes Update wenn ich was Neues poste. |
| Button            | Dabei sein                                                                    |
| Email placeholder | deine@email.de                                                                |
| Social proof      | `{n} Leser dabei.`                                                            |

### Success state (pending confirmation)

> Fast da — check kurz dein Postfach und bestätige einmal. Dauert 10 Sekunden.

### Success state (already subscribed)

> Du bist schon dabei.  
> Diese Adresse ist bereits eingetragen — du bekommst schon Updates.

### Rate limited state

> Kurz durchatmen.  
> Zu viele Versuche — versuch's in einer Stunde nochmal.

### Confirmed subscription toast (`?subscribed=true`)

**Title:** Du bist dabei 👋  
**Description:** Ab jetzt kriegst du einen kurzen Hinweis wenn ich was Neues poste.

### Double opt-in confirmation email

**Betreff:** kurz bestätigen, dann bist du dabei

**Body:**

```
Hey,

schön dass du dabei bist. Klick einmal kurz auf den Link unten, damit ich weiß
dass du das wirklich warst — dann bekommst du einen kurzen Hinweis wenn ich
was Neues auf dem Journal poste.

[Jetzt bestätigen →]

Bis bald,
Manu

—
Du bekommst diese Mail weil jemand (hoffentlich du) sich auf journal.lippe-mann.de
eingetragen hat. Falls nicht einfach ignorieren.
```

### New post notification email

**Betreff (photo post):** neue Fotos ↗  
**Betreff (article):** `{{ params.title }}`

**Body:**

```
Hey,

{{ params.description }}

[Ansehen →]

Manu

—
[Abmelden] · keine Antwort nötig, ich les aber trotzdem mit 👋
```

### Unsubscribe confirmation

> Schade, aber kein Problem — du bist raus. Deine Adresse wird gelöscht.

### Error state (signup form)

> Hat nicht geklappt — versuch's nochmal.

---

## 11. GDPR Compliance Checklist

These are non-negotiable for an EU-facing list.

- [ ] **Double opt-in** — subscriber is only added after clicking the confirmation link. Configured via Brevo dashboard per list. ✓ handled by `doubleOptinConfirmation` endpoint
- [ ] **Privacy policy** — linked visibly from the signup form. Must state: what data is collected (email address), purpose (post notifications), storage location (Brevo, EU servers), and how to request deletion.
- [ ] **Explicit consent** — the subscribe button is a standalone action. Not pre-ticked, not bundled with account creation or another action.
- [ ] **Easy unsubscribe** — one-click unsubscribe in every email. ✓ handled by Brevo via `{{ unsubscribeLink }}`
- [ ] **Data deletion on request** — delete any subscriber via Brevo dashboard (Contacts → search → delete) or via `DELETE /contacts/{email}` API call.
- [ ] **No third-party data sharing** — do not pass subscriber emails to analytics tools, CDNs, or any other service.

> Brevo is headquartered in Paris and stores EU customer data on EU servers. It is covered under the EU–US Data Privacy Framework and compliant with GDPR Article 28 (data processor agreement available in account settings).

---

## 12. Implementation Order

Suggested sequence to ship incrementally without breaking existing functionality:

1. Set up Brevo account, create list, configure double opt-in in dashboard
2. Add all env vars to `.env` and Vercel project settings
3. Create `src/lib/rate-limit.ts`
4. Create `src/lib/brevo.ts` utility
5. Add `newsletter` tRPC router (subscribe + getSubscriberCount)
6. Build `NewsletterSignup` component with subscriber count, place in feed
7. Add `SubscribedToast` component, mount in homepage/layout
8. Add `description` field to DB schema + `bun db:push`
9. Add `sendTestNotification` tRPC procedure
10. Update article form UI (description textarea + test send button + notify toggle)
11. Update photo confirm step UI
12. Update posts `create` mutation to trigger `sendNotification`
13. Build and test Brevo email template (both DOI and notification)
14. Do a full end-to-end test: subscribe → confirm → publish → receive email
15. Write and configure all copy in Brevo templates
