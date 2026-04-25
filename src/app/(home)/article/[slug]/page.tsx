import { Metadata } from 'next';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { ArticleSlugView } from '@/modules/blog/ui/views/blog-slug-view';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  if (!data) return {};

  const imageUrl = data.coverImage ? keyToUrl(data.coverImage) : undefined;
  const description = `Lies den Artikel "${data.title}" in meinem Journal.`;

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

const ArticlePage = async ({ params }: Props) => {
  const { slug } = await params;
  return <ArticleSlugView slug={slug} />;
};

export default ArticlePage;
