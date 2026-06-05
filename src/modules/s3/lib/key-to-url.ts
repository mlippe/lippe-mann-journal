const BASE_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/+$/, "");

export const keyToUrl = (key: string | undefined | null) => {
  if (!key) {
    return "";
  }

  // If the key is already a full URL (http/https), a data URL, or a blob URL, return it as is
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("data:") ||
    key.startsWith("blob:")
  ) {
    return key;
  }

  // Ensure key doesn't have a leading slash if we're adding one
  const normalizedKey = key.startsWith("/") ? key.slice(1) : key;

  return `${BASE_URL}/${normalizedKey}`;
};
