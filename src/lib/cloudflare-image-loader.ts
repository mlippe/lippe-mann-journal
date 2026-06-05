const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';

const normalizeSrc = (src: string) => {
  return src.startsWith('/') ? src.slice(1) : src;
};

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Handle data URLs - return as is
  if (src.startsWith('data:')) {
    return src;
  }

  // If it's a local asset (starts with /), let Next.js handle it
  // But we must return a URL that includes the width to satisfy Next.js
  if (src.startsWith('/')) {
    return `${src}?width=${width}${quality ? `&quality=${quality}` : ''}`;
  }

  // If it's already an optimized Cloudflare URL, return it
  if (src.includes('/cdn-cgi/image/')) {
    return src;
  }

  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(',');

  // If src is a full URL
  if (src.startsWith('http')) {
    // If it's an image from our S3 bucket, we can use the relative path
    if (S3_PUBLIC_URL && src.startsWith(S3_PUBLIC_URL)) {
      const relativeSrc = src.replace(S3_PUBLIC_URL, '');
      return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(
        relativeSrc,
      )}`;
    }

    // For external URLs, Cloudflare Image Resizing usually requires a specific setup 
    // (like being on the same zone or using a specific worker).
    // For now, to fix the 404 and warnings, we return the external URL with dummy params
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}${quality ? `&q=${quality}` : ''}`;
  }

  // If it's just a key (not a full URL), treat it as an S3 asset
  return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
}
