const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";

const normalizeSrc = (src: string) => {
  return src.startsWith("/") ? src.slice(1) : src;
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
  // If it's a local asset (starts with /), optimize with Next.js built-in optimization
  if (src.startsWith("/")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${
      quality || 75
    }`;
  }

  // If it's already an optimized Cloudflare URL, return it
  if (src.includes("/cdn-cgi/image/")) {
    return src;
  }

  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(",");

  // If src is a full URL, extract the pathname. Otherwise, use it as is.
  let relativeSrc = src;
  if (src.startsWith("http")) {
    try {
      relativeSrc = new URL(src).pathname;
    } catch (e) {
      // If URL parsing fails, fall back to original src
    }
  }

  return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(
    relativeSrc,
  )}`;
}
