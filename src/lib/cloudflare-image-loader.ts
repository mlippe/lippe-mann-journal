const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';

const normalizeSrc = (src: string) => src.replace(/^\/+/, '');

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Ensure src is relative to bucket
  const relativeSrc = src.startsWith('http')
    ? new URL(src).pathname
    : normalizeSrc(src);

  const params = [`width=${width}`];
  if (quality) params.push(`quality=${quality}`);
  const paramsString = params.join(',');

  // Return correct Cloudflare Image URL
  return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${relativeSrc}`;
}
