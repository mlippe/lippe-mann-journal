import { siteConfig } from '@/site.config';
import cloudflareLoader from './cloudflare-image-loader';

/**
 * Generates an optimized image URL for social previews (OG images).
 * If Cloudflare is configured, it uses the Cloudflare image resizing service.
 * Otherwise, it falls back to Next.js built-in image optimization.
 */
export function getOptimizedImageUrl(src: string, width: number = 1080): string {
  if (!src) return '';

  // If Cloudflare loader is enabled, use it
  if (siteConfig.imageLoader === 'cloudflare') {
    return cloudflareLoader({ src, width, quality: 75 });
  }

  // Fallback to Next.js image optimization
  // We need an absolute URL for social fetchers
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000';

  // Ensure baseUrl has a protocol and no trailing slash
  let baseUrl = rawBaseUrl.trim();
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');

  // If src is already an absolute URL, we can use it directly in the url parameter
  // Next.js _next/image requires the url to be encoded
  try {
    const url = new URL(`${baseUrl}/_next/image`);
    url.searchParams.set('url', src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', '75');
    return url.toString();
  } catch (e) {
    console.error('Error generating optimized image URL:', e);
    return src;
  }
}
