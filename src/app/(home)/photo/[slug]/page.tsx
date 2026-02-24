import { Metadata } from 'next';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { PhotographDetailPage } from '@/modules/photograph/ui/views/photograph-detail-page';

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

const PhotoPage = async ({ params }: Props) => {
  const { slug } = await params;
  return <PhotographDetailPage slug={slug} isModal={false} />;
};

export default PhotoPage;
