import { Suspense } from 'react';
import { PhotographDetailPage } from '@/modules/photograph/ui/views/photograph-detail-page';
import { LoadingState } from '@/modules/photograph/ui/views/photograph-view';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PhotoInterceptorPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense fallback={<LoadingState isModal={true} />}>
      <PhotographDetailPage slug={slug} isModal={true} />
    </Suspense>
  );
}
