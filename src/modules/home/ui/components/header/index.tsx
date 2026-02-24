import Graphic from '../../../../../components/graphic';
import MobileMenuButton from './mobile-menu-button';
import Navbar from './navbar';

const Header = () => {
  return (
    <header className='fixed top-3 lg:top-0 lg:pt-3 lg:left-3 left-0 z-50 bg-background rounded-br-[18px]'>
      <div className='relative'>
        <Navbar />
        {/* MOBILE TOP BAR  */}
        <div className='border-t-12 fixed top-0 left-0 w-full border-background block lg:hidden'></div>

        <div className='absolute lg:left-0 -bottom-4.5 size-4.5'>
          <Graphic />
        </div>

        <div className='absolute top-0 lg:-top-3 -right-4.5 size-4.5'>
          <Graphic />
        </div>
      </div>

      <MobileMenuButton />
    </header>
  );
};

export default Header;
