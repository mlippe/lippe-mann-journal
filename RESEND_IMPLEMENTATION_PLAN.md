# Implementation Plan: Resend Newsletter & Post Notification Flow

> **Status:** Draft / Ready for Implementation · **Journal:** `journal.lippe-mann.de`  
> **Tech Stack:** Next.js 15 (App Router) · React Email · Resend API · Neon PostgreSQL & Drizzle ORM · tRPC

---

## 1. Executive Summary & Philosophy

Das Photo Journal von Manuel Lippmann ist ein ruhiger, kuratierter Ort für Fotografie und kurze Texte („Field Notes“). Die E-Mail-Benachrichtigung soll sich **nicht wie ein Marketing-Newsletter anfühlen**, sondern wie ein persönlicher Bild-Gruß eines Freundes:

- **Minimalistisch & bildzentriert:** Das Cover-Foto steht im Mittelpunkt, gefolgt vom Titel, Metadaten (Kamera/Datum) und dem Notiztext.
- **DSGVO-konform (Double Opt-In):** Niemand erhält Benachrichtigungen ohne explizite E-Mail-Bestätigung über einen zeitlich begrenzten Signatur-Token.
- **1-Klick-Abmeldung:** Jeder Link enthält einen recipient-spezifischen Unsubscribe-Token (`List-Unsubscribe`-Header nach RFC 8058 für native 1-Klick-Abmeldung in Gmail & Apple Mail).
- **Entkoppelt & Sicher:** Auslösen der Benachrichtigung wahlweise automatisch beim Veröffentlichen oder manuell über das Admin-Dashboard mit vorheriger Test-E-Mail an dich selbst.

---

## 2. End-to-End System Architecture

```
                                      [ BESUCHER / LESER ]
                                                │
                          1. Trägt E-Mail ein   │ (Footer / Stream Widget)
                                                ▼
                                    [ Next.js API / tRPC ]
                                                │
                          2. Token generieren   │ status = 'pending'
                                                ▼
                                   [ Neon DB: subscribers ]
                                                │
                          3. DOI-Mail via Resend│ React Email Template
                                                ▼
                                     [ Postfach Leser ]
                                                │
                          4. Klick auf Link     │ /newsletter/confirm?token=...
                                                ▼
                                    [ Next.js API / tRPC ]
                                                │
                          5. status = 'active'  │ verifiedAt = NOW()
                                                ▼
                                     [ Bestätigungsseite ]
                                    (?subscribed=true Toast)

─────────────────────────────────────────────────────────────────────────────

                                        [ ADMIN ]
                                                │
                          1. Neuer Post / Foto  │ Veröffentlichen im Admin UI
                                                │
                          2. Optional: Test-Mail│ Sendet Vorschau an Manuel
                                                ▼
                                    [ Next.js Dispatcher ]
                                                │
                          3. Lade alle aktiven  │ SELECT email, token
                             Abonnenten         │ FROM subscribers WHERE status='active'
                                                ▼
                                     [ Resend Batch API ]
                                                │ resend.batch.send()
                                                ▼
                                     [ Alle Abonnenten ]
```

---

## 3. Database Schema (`src/db/schema.ts`)

Wir legen eine neue Tabelle `subscribers` an und erweitern die `posts`-Tabelle um Tracking-Felder für den E-Mail-Versand.

### 3.1. Tabelle `subscribers`

```typescript
// In src/db/schema.ts
import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const subscriberStatusEnum = pgEnum('subscriber_status', [
  'pending',       // Double Opt-In E-Mail verschickt, wartet auf Klick
  'active',        // Bestätigt und empfängt Benachrichtigungen
  'unsubscribed',  // Hat sich abgemeldet
]);

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  status: subscriberStatusEnum('status').notNull().default('pending'),
  token: text('token').notNull().unique(), // Kryptografischer Token für Bestätigung & Abmeldung
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscribersInsertSchema = createInsertSchema(subscribers, {
  email: (s) => s.email.email().trim().toLowerCase(),
});
export const subscribersSelectSchema = createSelectSchema(subscribers);
export type Subscriber = z.infer<typeof subscribersSelectSchema>;
```

### 3.2. Erweiterung der `posts`-Tabelle

Damit Benachrichtigungen nicht versehentlich mehrfach verschickt werden (z. B. wenn ein Post nach Veröffentlichung editiert wird):

```typescript
export const posts = pgTable('posts', {
  // ... bestehende Felder
  emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
  emailRecipientCount: integer('email_recipient_count'),
});
```

---

## 4. Dependencies & Environment Configuration

### 4.1. Installation

```bash
bun add resend @react-email/components
```

### 4.2. `.env` & `.env.example`

```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Manuel Lippmann <journal@mail.lippe-mann.de>"
RESEND_REPLY_TO="hallo@lippe-mann.de"

# Base URL für Token-Links & Bilder
NEXT_PUBLIC_APP_URL=https://journal.lippe-mann.de
```

> **DNS-Empfehlung für Resend:**
> Eine Subdomain wie `mail.lippe-mann.de` nutzen. Resend stellt DKIM, SPF (TXT) und MX-Records bereit. Dies garantiert eine Zustellrate von ~99% direkt in die primäre Inbox statt Spam oder Promotions.

---

## 5. React Email Templates

Templates werden mit `@react-email/components` gebaut. Sie rendern sowohl pixelperfektes, responsives HTML als auch automatischen Fallback-Klartext für Reader und E-Mail-Clients.

### 5.1. Double Opt-In E-Mail (`src/emails/confirm-subscription.tsx`)

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ConfirmSubscriptionEmailProps {
  confirmUrl: string;
}

export const ConfirmSubscriptionEmail = ({
  confirmUrl,
}: ConfirmSubscriptionEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bitte bestätige deine Anmeldung zum Photo Journal</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Lippe Mann Journal</Heading>
          <Text style={text}>
            Hallo,
            <br /><br />
            du hast dich für Benachrichtigungen zu neuen Fotostrecken und Notizen aus meinem Journal eingetragen.
          </Text>
          <Section style={btnSection}>
            <Link style={button} href={confirmUrl}>
              E-Mail-Adresse bestätigen &rarr;
            </Link>
          </Section>
          <Text style={subText}>
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
            <br />
            <Link href={confirmUrl} style={link}>{confirmUrl}</Link>
          </Text>
          <Text style={footerText}>
            Falls du diese Anfrage nicht gestellt hast, kannst du diese Nachricht einfach ignorieren.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f8f8f8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 16px',
};
const container = {
  backgroundColor: '#ffffff',
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px',
  borderRadius: '8px',
  border: '1px solid #e5e5e5',
};
const heading = {
  fontSize: '20px',
  fontWeight: '500',
  letterSpacing: '-0.02em',
  marginBottom: '24px',
};
const text = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#333333',
};
const btnSection = {
  margin: '32px 0',
};
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
};
const subText = {
  fontSize: '12px',
  color: '#777777',
  wordBreak: 'break-all' as const,
};
const link = {
  color: '#111111',
};
const footerText = {
  fontSize: '11px',
  color: '#999999',
  marginTop: '32px',
  borderTop: '1px solid #eee',
  paddingTop: '16px',
};
```

---

### 5.2. Neuer Post / Foto Notification Template (`src/emails/new-post.tsx`)

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface NewPostEmailProps {
  postTitle: string;
  postUrl: string;
  heroImageUrl?: string;
  excerpt?: string;
  metaInfo?: string; // z.B. "Tokyo, Japan · Leica M11 · 35mm"
  unsubscribeUrl: string;
}

export const NewPostEmail = ({
  postTitle,
  postUrl,
  heroImageUrl,
  excerpt,
  metaInfo,
  unsubscribeUrl,
}: NewPostEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{postTitle} · Neuer Eintrag im Lippe Mann Journal</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Link href="https://journal.lippe-mann.de" style={brandLink}>
              LIPPE MANN JOURNAL
            </Link>
          </Section>

          {/* Hero Image */}
          {heroImageUrl && (
            <Section style={imageSection}>
              <Link href={postUrl}>
                <Img
                  src={heroImageUrl}
                  alt={postTitle}
                  style={heroImg}
                  width="100%"
                />
              </Link>
            </Section>
          )}

          {/* Meta (Ort, Kamera) */}
          {metaInfo && <Text style={metaText}>{metaInfo.toUpperCase()}</Text>}

          {/* Title */}
          <Heading style={postHeading}>
            <Link href={postUrl} style={titleLink}>
              {postTitle}
            </Link>
          </Heading>

          {/* Excerpt / Field Note */}
          {excerpt && <Text style={excerptText}>{excerpt}</Text>}

          {/* Action Link */}
          <Section style={ctaSection}>
            <Link href={postUrl} style={ctaButton}>
              Im Journal ansehen &rarr;
            </Link>
          </Section>

          {/* Footer & Unsubscribe */}
          <Section style={footerSection}>
            <Text style={footerNotice}>
              Du erhältst diese Nachricht, weil du dich auf{' '}
              <Link href="https://journal.lippe-mann.de" style={footerLink}>
                journal.lippe-mann.de
              </Link>{' '}
              eingetragen hast.
            </Text>
            <Text style={footerNotice}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Vom Newsletter abmelden
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f5f5f4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '40px 12px',
};
const container = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '36px',
  borderRadius: '8px',
  border: '1px solid #e7e5e4',
};
const headerSection = {
  marginBottom: '28px',
};
const brandLink = {
  fontFamily: 'monospace',
  fontSize: '12px',
  letterSpacing: '0.14em',
  color: '#78716c',
  textDecoration: 'none',
};
const imageSection = {
  marginBottom: '24px',
};
const heroImg = {
  width: '100%',
  borderRadius: '4px',
  display: 'block',
};
const metaText = {
  fontSize: '11px',
  fontFamily: 'monospace',
  letterSpacing: '0.1em',
  color: '#a8a29e',
  margin: '0 0 8px 0',
};
const postHeading = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  letterSpacing: '-0.02em',
  margin: '0 0 16px 0',
};
const titleLink = {
  color: '#1c1917',
  textDecoration: 'none',
};
const excerptText = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#44403c',
  margin: '0 0 24px 0',
};
const ctaSection = {
  margin: '28px 0',
};
const ctaButton = {
  backgroundColor: '#1c1917',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
};
const footerSection = {
  borderTop: '1px solid #e7e5e4',
  paddingTop: '20px',
  marginTop: '36px',
};
const footerNotice = {
  fontSize: '11px',
  color: '#a8a29e',
  lineHeight: '1.5',
  margin: '4px 0',
};
const footerLink = {
  color: '#78716c',
  textDecoration: 'underline',
};
const unsubscribeLink = {
  color: '#a8a29e',
  textDecoration: 'underline',
};
```

---

## 6. Backend API & Token Flow

### 6.1. Subscription & DOI Initiation

**Route:** `POST /api/newsletter/subscribe` (oder tRPC `newsletter.subscribe`)

1. Validiert E-Mail mit Zod.
2. Prüft auf Duplikate:
   - Bereits `active`: Gibt freundliche Meldung zurück („Du bist bereits eingetragen“).
   - Bereits `pending`: Aktualisiert den Token & schickt Bestätigungs-E-Mail erneut.
   - Neu: Erzeugt Zufallstoken mit `crypto.randomBytes(32).toString('hex')`, speichert in DB.
3. Versendet `ConfirmSubscriptionEmail` via Resend:
   ```typescript
   await resend.emails.send({
     from: process.env.RESEND_FROM_EMAIL!,
     to: email,
     subject: 'Bitte bestätige deine Anmeldung zum Lippe Mann Journal',
     react: ConfirmSubscriptionEmail({ confirmUrl }),
   });
   ```

### 6.2. Double Opt-In Bestätigung

**Route:** `GET /api/newsletter/confirm?token=...`

1. Sucht Subscriber anhand des Tokens:
   ```typescript
   const subscriber = await db.query.subscribers.findFirst({
     where: eq(subscribers.token, token),
   });
   ```
2. Falls nicht gefunden: Umleitung auf `/?error=invalid_token`.
3. Falls gefunden:
   ```typescript
   await db.update(subscribers)
     .set({
       status: 'active',
       verifiedAt: new Date(),
       updatedAt: new Date(),
     })
     .where(eq(subscribers.id, subscriber.id));
   ```
4. Umleitung auf `/?subscribed=true`.

### 6.3. Unsubscribe Handler (RFC 8058 & Web)

**Route:** `GET /api/newsletter/unsubscribe?token=...` & `POST` (für List-Unsubscribe Header)

1. Setzt `status = 'unsubscribed'`, `unsubscribedAt = new Date()`.
2. Zeigt schlichte Erfolgsseite: „Du hast dich erfolgreich abgemeldet.“

---

## 7. Dispatcher Engine (Resend Batch API)

Beim Veröffentlichen eines Posts oder per manuellem Klick im Admin Dashboard:

```typescript
// src/modules/newsletter/server/dispatch.ts
import { Resend } from 'resend';
import { db } from '@/db';
import { subscribers, posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NewPostEmail } from '@/emails/new-post';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function dispatchPostNotification(postId: string, options: { testEmail?: string } = {}) {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      postsToPhotos: {
        with: { photo: true },
      },
    },
  });

  if (!post) throw new Error('Post not found');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://journal.lippe-mann.de';
  const postUrl = `${baseUrl}/post/${post.slug || post.id}`;
  const firstPhoto = post.postsToPhotos?.[0]?.photo;
  const heroImageUrl = firstPhoto ? keyToUrl(firstPhoto.url) : undefined;
  const excerpt = post.content ? post.content.slice(0, 240) + '...' : undefined;

  // Modus A: Test-E-Mail nur an mich
  if (options.testEmail) {
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: options.testEmail,
      subject: `[Vorschau] ${post.title}`,
      react: NewPostEmail({
        postTitle: post.title,
        postUrl,
        heroImageUrl,
        excerpt,
        unsubscribeUrl: `${baseUrl}/api/newsletter/unsubscribe?token=preview`,
      }),
    });
  }

  // Modus B: Alle aktiven Abonnenten
  const recipients = await db.query.subscribers.findMany({
    where: eq(subscribers.status, 'active'),
  });

  if (recipients.length === 0) return { dispatched: 0 };

  // Resend batch API (Chunke in Blöcke à 100 Empfänger)
  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);
    
    const emailPayloads = chunk.map((sub) => {
      const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${sub.token}`;
      return {
        from: process.env.RESEND_FROM_EMAIL!,
        to: sub.email,
        subject: `Neuer Eintrag: ${post.title}`,
        react: NewPostEmail({
          postTitle: post.title,
          postUrl,
          heroImageUrl,
          excerpt,
          unsubscribeUrl: unsubUrl,
        }),
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    await resend.batch.send(emailPayloads);
  }

  // Vermerke Versanddatum am Post
  await db.update(posts)
    .set({
      emailSentAt: new Date(),
      emailRecipientCount: recipients.length,
    })
    .where(eq(posts.id, post.id));

  return { dispatched: recipients.length };
}
```

---

## 8. Frontend UI Integration

### 8.1. Minimalistisches Newsletter-Widget im Feed

Ein schlichter, typografischer Kasten am Ende des Feeds oder im Footer:

```tsx
// src/components/newsletter-signup.tsx
'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fehler beim Anmelden.');
      setState('success');
      setMsg(data.message || 'Prüfe dein Postfach, um die Anmeldung zu bestätigen.');
    } catch (err: any) {
      setState('error');
      setMsg(err.message || 'Etwas ist schiefgelaufen.');
    }
  };

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 py-4">
        <Check className="w-4 h-4 text-emerald-500" />
        <span>{msg}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine.email@beispiel.de"
        disabled={state === 'loading'}
        className="flex-1 px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="px-4 py-2 text-sm rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Benachrichtigen'}
      </button>
    </form>
  );
}
```

---

## 9. Schritt-für-Schritt Implementierungsphasen

| Phase | Aufgabe | Deliverables |
|---|---|---|
| **Phase 1: Setup & Domain** | Resend Account anlegen, Subdomain `mail.lippe-mann.de` verifizieren, API-Key in `.env` hinterlegen. | DNS DKIM/SPF verifiziert, API Key aktiv. |
| **Phase 2: DB-Schema** | `subscribers`-Tabelle in `schema.ts` definieren, Drizzle Push ausführen. | Neon DB Tabelle einsatzbereit. |
| **Phase 3: React Email** | `confirm-subscription.tsx` und `new-post.tsx` Templates gestalten und testen. | Schöne, responsive E-Mail-Templates. |
| **Phase 4: API & DOI Flow** | `/api/newsletter/subscribe`, `/confirm`, `/unsubscribe` Endpoints schreiben. | DSGVO Double-Opt-In voll funktionsfähig. |
| **Phase 5: Frontend UI** | Signup-Komponente im Footer und Stream einbinden, Toast für `?subscribed=true`. | Leser können sich eintragen. |
| **Phase 6: Admin Dispatcher** | Button „Test-Mail senden“ & „An Abonnenten senden“ in Post-Editor einbauen. | Kontrollierter Versand auf Knopfdruck. |

---

## 10. Kosten & Limits

- **Resend Free Tier:** 3.000 E-Mails/Monat, 100 E-Mails/Tag (völlig ausreichend für die Startphase des Journals).
- **Pro Tier ($20/Monat):** 50.000 E-Mails/Monat ohne Tageslimit, sobald die Leserschaft wächst.
