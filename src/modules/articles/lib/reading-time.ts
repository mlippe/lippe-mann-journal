export const calculateReadingTime = (content: string | null | undefined): number => {
  if (!content) return 0;
  
  // Remove HTML tags if content is HTML
  const text = content.replace(/<[^>]*>/g, '');
  
  const wordsPerMinute = 225;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};
