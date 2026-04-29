const BASE_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(/\/+$/, "");

export const keyToUrl = (key: string | undefined | null) => {
  if (!key) {
    return "";
  }

  // Ensure key doesn't have a leading slash if we're adding one
  const normalizedKey = key.startsWith("/") ? key.slice(1) : key;

  return `${BASE_URL}/${normalizedKey}`;
};
