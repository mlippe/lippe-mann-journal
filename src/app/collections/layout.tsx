import Header from '@/modules/home/ui/components/header';
import type { PropsWithChildren } from 'react';

const CollectionLayout = async ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header />
      <main className='h-screen p-3'>{children}</main>
    </>
  );
};

export default CollectionLayout;
