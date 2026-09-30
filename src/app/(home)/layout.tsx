import Header from '@/modules/home/ui/components/header';
import type { PropsWithChildren, ReactNode } from 'react';

export type HomeLayoutProps = Readonly<
  PropsWithChildren<{
    modals: ReactNode;
  }>
>;

const HomeLayout = async ({ children, modals }: HomeLayoutProps) => {
  return (
    <>
      <Header />
      <main className='min-h-screen p-3 md:p-6 pb-24'>{children}</main>
      {modals}
    </>
  );
};

export default HomeLayout;
