import { db } from '@/db';
import { siteConfig } from '@/site.config';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { createPreview } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (envUrl) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean;
  }
  return 'https://journal.lippe-mann.de';
}

function getPostHref(post: { type: string; slug?: string | null; id: string }): string {
  if (post.slug) {
    if (post.type === 'ARTICLE') return `/article/${post.slug}`;
    if (post.type === 'PHOTO') return `/photo/${post.slug}`;
    if (post.type === 'ALBUM') return `/album/${post.slug}`;
  }
  return `/post/${post.slug || post.id}`;
}

type FeedPost = {
  id: string;
  title: string;
  slug: string | null;
  visibility: string;
  type: string;
  coverImage?: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  postsToPhotos?: Array<{
    photo?: {
      id: string;
      url: string;
      title: string | null;
    } | null;
    sortOrder?: number;
  }>;
  postsToCollections?: Array<{
    collection?: {
      name: string;
    } | null;
  }>;
};

export async function GET() {
  const baseUrl = getBaseUrl();

  // Limit to max 15 posts for lightning-fast loading and lean payload
  const rawPosts = await db.query.posts.findMany({
    where: (posts, { eq }) => eq(posts.visibility, 'public'),
    orderBy: (posts, { desc }) => [desc(posts.createdAt), desc(posts.id)],
    limit: 15,
    with: {
      postsToPhotos: {
        with: {
          photo: true,
        },
      },
      postsToCollections: {
        with: {
          collection: true,
        },
      },
    },
  });

  const publicPosts = rawPosts as unknown as FeedPost[];

  const lastBuildDate =
    publicPosts.length > 0 && publicPosts[0].createdAt
      ? new Date(publicPosts[0].createdAt).toUTCString()
      : new Date().toUTCString();

  const itemsXml = publicPosts
    .map((post) => {
      const postUrl = `${baseUrl}${getPostHref(post)}`;
      const pubDate = new Date(post.createdAt).toUTCString();
      const photos = (post.postsToPhotos || [])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((p2p) => p2p.photo)
        .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
      const heroPhoto = photos[0];
      const heroUrl = heroPhoto
        ? keyToUrl(heroPhoto.url)
        : post.coverImage
          ? keyToUrl(post.coverImage)
          : null;

      // Clean, concise excerpt: strip inline data-URIs / figures and truncate cleanly
      let excerpt = '';
      if (post.content) {
        const stripped = post.content
          .replace(/data:image\/[^;]+;base64,[^"'\s>]+/gi, '')
          .replace(/<figcaption[^>]*>.*?<\/figcaption>/gi, ' ');
        excerpt = createPreview(stripped, 260);
      }

      if (!excerpt) {
        excerpt =
          photos.length > 0
            ? `${photos.length} Aufnahme${photos.length > 1 ? 'n' : ''} in dieser Serie.`
            : post.title;
      }

      // Build concise HTML content for feed readers (lightweight, no bloated base64 or long dumps)
      const contentParts: string[] = [];

      if (heroUrl) {
        contentParts.push(
          `<p><img src="${escapeXml(heroUrl)}" alt="${escapeXml(
            heroPhoto?.title || post.title,
          )}" style="max-width: 100%; height: auto; border-radius: 4px;" /></p>`,
        );
      }

      if (excerpt) {
        contentParts.push(`<p>${escapeXml(excerpt)}</p>`);
      }

      if (photos.length > 1) {
        contentParts.push(
          `<p><em>+ ${photos.length - 1} weitere Aufnahme${
            photos.length > 2 ? 'n' : ''
          } im Journal</em></p>`,
        );
      }

      contentParts.push(
        `<p><a href="${escapeXml(postUrl)}">Eintrag im Journal ansehen &rarr;</a></p>`,
      );

      const encodedContent = `<![CDATA[${contentParts.join('\n')}]]>`;

      const categoriesXml =
        post.postsToCollections
          ?.map((ptc) => ptc.collection?.name)
          .filter(Boolean)
          .map((name) => `<category>${escapeXml(name!)}</category>`)
          .join('\n      ') || '';

      const enclosureXml = heroUrl
        ? `<enclosure url="${escapeXml(heroUrl)}" length="0" type="image/jpeg" />
      <media:content url="${escapeXml(heroUrl)}" medium="image" />`
        : '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${siteConfig.name}]]></dc:creator>
      ${categoriesXml ? `${categoriesXml}\n      ` : ''}<description><![CDATA[${excerpt}]]></description>
      <content:encoded>${encodedContent}</content:encoded>
      ${enclosureXml}
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(siteConfig.bio || siteConfig.metadata.description)}</description>
    <language>de</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
