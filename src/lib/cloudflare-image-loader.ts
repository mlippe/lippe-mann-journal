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
  if (src.startsWith("/")) {
    return src;
  }
  // if (process.env.NODE_ENV === "development") {
  //   return src;
  // }
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(",");

  // If src is a full URL, extract the pathname. Otherwise, use it as is.
  const relativeSrc = src.startsWith("http") ? new URL(src).pathname : src;

  return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(
    relativeSrc,
  )}`;
}
