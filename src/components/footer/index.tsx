import FooterNav from './footer-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const Footer = () => {
  return (
    <div className='flex flex-col items-center lg:items-start p-16 pb-12 gap-8 lg:gap-16 rounded-xl font-light relative flex-1 bg-primary text-white dark:text-black'>
      <div className='flex flex-col lg:flex-row gap-4 items-center'>
        {/* AVATAR  */}
        <Avatar className='size-[60px]'>
          <AvatarImage src={siteConfig.avatar} alt='avatar' sizes='60px' />
          <AvatarFallback>{siteConfig.initials}</AvatarFallback>
        </Avatar>

        {/* NAME  */}
        <div className='flex flex-col items-center lg:items-start gap-[2px]'>
          <span className='text-xl sm:text-2xl font-medium tracking-tight'>{siteConfig.name}</span>
          <p className='text-xs sm:text-sm opacity-75'>{siteConfig.role}</p>
        </div>
      </div>
      <div className='grid lg:w-full grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-14'>
        <FooterNav
          title='Seiten'
          links={[
            { title: 'Feed', href: '/' },
            { title: 'Sammlungen', href: '/collections' },
            { title: 'Über das Journal', href: '/about' },
            { title: 'RSS Feed', href: '/feed.xml', target: '_blank', rel: 'alternate type="application/rss+xml"' },
          ]}
        />
      </div>
    </div>
  );
};

export default Footer;
