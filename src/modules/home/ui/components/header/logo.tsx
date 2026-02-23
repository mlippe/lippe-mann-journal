import Link from 'next/link';
import WordRotate from '../word-rotate';
import { siteConfig } from '@/site.config';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href='/' className='flex gap-2 items-center group'>
      <Image
        src='/lm_logo.svg'
        alt=''
        width={32}
        height={32}
        className='size-4.5 grayscale-25 group-hover:grayscale-0 transition-all'
      />
      <WordRotate
        label={siteConfig.title}
        label2={siteConfig.tagline}
        style='font-medium uppercase'
      />
    </Link>
  );
};

export default Logo;
