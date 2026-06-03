import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Footer from '@/components/footer';
import Image from 'next/image';
import { Post, Photo } from '@/db/schema';
import RichTextViewer from '@/components/editor/rich-text-viewer';
import { getOptimizedImageUrl } from '@/lib/images';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Suspense } from 'react';

export const generateMetadata = async ({
  params,
}: {
  params: { postId: string };
}) => {
  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getPostById.queryOptions({ postId: params.postId }),
  );

  if (!post) return {};

  const postWithPhotos = post as Post & { postsToPhotos: { photo: Photo }[] };
  const firstPhoto = postWithPhotos.postsToPhotos?.[0]?.photo;
  const rawImageUrl = firstPhoto
    ? keyToUrl(firstPhoto.url)
    : post.coverImage
      ? keyToUrl(post.coverImage)
      : undefined;

  const imageUrl = rawImageUrl ? getOptimizedImageUrl(rawImageUrl) : undefined;

  let description = '';
  if (post.type === 'ARTICLE') {
    description = `Lies den Artikel "${post.title}" in meinem Journal.`;
  } else if (post.type === 'PHOTO') {
    description = `Schau dir dieses Foto "${post.title}" in meinem Journal an.`;
  } else if (post.type === 'ALBUM') {
    description = `Schau dir das Album "${post.title}" in meinem Journal an.`;
  } else {
    description = `Sieh dir "${post.title}" in meinem Journal an.`;
  }

  return {
    title: post.title || 'Post',
    description,
    openGraph: {
      title: post.title || 'Post',
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title || 'Post',
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
};

const SinglePostView = ({ params }: { params: { postId: string } }) => {
  const { postId } = params;

  return (
    <div className='flex flex-col min-h-screen w-full'>
      <Suspense fallback={<PostSkeleton />}>
        <SinglePostSuspense postId={postId} />
      </Suspense>
      <Footer />
    </div>
  );
};

const PostSkeleton = () => (
  <div className='w-full'>
    <div className='w-full h-[50vh] bg-muted animate-pulse' />
    <div className='max-w-3xl mx-auto space-y-4 py-8 px-4'>
      <div className='h-8 bg-muted animate-pulse rounded w-3/4' />
      <div className='h-4 bg-muted animate-pulse rounded w-full' />
      <div className='h-4 bg-muted animate-pulse rounded w-full' />
      <div className='h-4 bg-muted animate-pulse rounded w-2/3' />
    </div>
  </div>
);

async function SinglePostSuspense({ postId }: { postId: string }) {
  const queryClient = getQueryClient();

  // Prefetch post details
  const post = await queryClient.fetchQuery(
    trpc.posts.getPostById.queryOptions({ postId }),
  );

  if (!post) {
    return <div className='text-center py-10'>Post not found.</div>;
  }

  // Type assertion for rendering PostCard-like content
  const postWithPhotos = post as Post & { postsToPhotos: { photo: Photo }[] };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* Post Header */}
      <div className='relative w-full h-[50vh] flex items-end p-8 text-white'>
        {postWithPhotos.coverImage && (
          <Image
            src={postWithPhotos.coverImage}
            alt={postWithPhotos.title}
            fill
            className='object-cover -z-10'
            priority
          />
        )}
        <div className='absolute inset-0 bg-black/50 -z-10' />
        <div>
          <h1 className='text-5xl font-bold'>{postWithPhotos.title}</h1>
        </div>
      </div>

      {/* Post Content */}
      <div className='w-full max-w-3xl mx-auto space-y-8 py-8 px-4'>
        {postWithPhotos.type === 'ARTICLE' && postWithPhotos.content && (
          <RichTextViewer content={postWithPhotos.content} />
        )}

        {postWithPhotos.type === 'PHOTO' && postWithPhotos.postsToPhotos[0] && (
          <div className='rounded-md overflow-hidden'>
            <Image
              src={postWithPhotos.postsToPhotos[0].photo.url}
              alt={postWithPhotos.postsToPhotos[0].photo.title}
              width={postWithPhotos.postsToPhotos[0].photo.width}
              height={postWithPhotos.postsToPhotos[0].photo.height}
              className='w-full h-auto'
            />
          </div>
        )}

        {postWithPhotos.type === 'ALBUM' &&
          postWithPhotos.postsToPhotos.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {postWithPhotos.postsToPhotos.map(({ photo }) => (
                <div
                  key={photo.id}
                  className='rounded-md overflow-hidden aspect-square'
                >
                  <Image
                    src={photo.url}
                    alt={photo.title}
                    width={photo.width}
                    height={photo.height}
                    className='w-full h-full object-cover'
                  />
                </div>
              ))}
            </div>
          )}
      </div>
    </HydrationBoundary>
  );
}

export default SinglePostView;
