import { PhotographDetailPage } from '@/modules/photograph/ui/views/photograph-detail-page';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AlbumInterceptorPage({ params }: Props) {
  const { slug } = await params;
  return <PhotographDetailPage slug={slug} isModal={true} />;
}

