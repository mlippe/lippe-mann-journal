import { Metadata } from 'next';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { ArticleSlugView } from '@/modules/blog/ui/views/blog-slug-view';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  return {
    title: data.title,
  };
}

const ArticlePage = async ({ params }: Props) => {
  const { slug } = await params;
  return <ArticleSlugView slug={slug} />;
};

export default ArticlePage;
