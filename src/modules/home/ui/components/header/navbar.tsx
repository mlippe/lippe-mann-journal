import Logo from './logo';
import FlipLink from '@/components/flip-link';
import { ThemeSwitch } from '@/components/theme-toggle';

const Navbar = () => {
  return (
    <nav>
      <div className='flex items-center gap-6 pb-3 px-4 relative'>
        <Logo />
        <div className='hidden lg:flex items-center gap-5'>
          <FlipLink href='/?view=zine'>Feed</FlipLink>
          <FlipLink href='/?view=grid'>Übersicht</FlipLink>
          <FlipLink href='/collections'>Sammlungen</FlipLink>
          <FlipLink href='/about'>Über</FlipLink>
        </div>
        <ThemeSwitch />
      </div>
    </nav>
  );
};

export default Navbar;
