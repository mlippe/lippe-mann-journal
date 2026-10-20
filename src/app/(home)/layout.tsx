import Header from '@/modules/home/ui/components/header';
import type { PropsWithChildren } from 'react';

export type HomeLayoutProps = Readonly<PropsWithChildren>;

const HomeLayout = async ({ children }: HomeLayoutProps) => {
  return (
    <>
      <Header />
      <main className='min-h-screen p-3 md:p-6 pb-24'>{children}</main>
    </>
  );
};

export default HomeLayout;
