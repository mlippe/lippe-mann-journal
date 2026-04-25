import { Metadata } from 'next';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { PhotographDetailPage } from '@/modules/photograph/ui/views/photograph-detail-page';
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

  const firstPhoto = data.postsToPhotos?.[0]?.photo;
  const imageUrl = firstPhoto
    ? keyToUrl(firstPhoto.url)
    : data.coverImage
      ? keyToUrl(data.coverImage)
      : undefined;

  const description = `Schau dir dieses Foto "${data.title}" in meinem Journal an.`;

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

const PhotoPage = async ({ params }: Props) => {
  const { slug } = await params;
  return <PhotographDetailPage slug={slug} isModal={false} />;
};

export default PhotoPage;
