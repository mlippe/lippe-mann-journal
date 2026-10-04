import Header from '@/modules/home/ui/components/header';
import type { PropsWithChildren } from 'react';

const CollectionLayout = async ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header />
      <main className='min-h-screen p-3 md:p-6 pb-20'>{children}</main>
    </>
  );
};

export default CollectionLayout;
