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
      <main className='h-screen p-3'>{children}</main>
      {modals}
    </>
  );
};

export default HomeLayout;
