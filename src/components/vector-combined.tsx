import Graphic from '@/components/graphic';
import Link from 'next/link';
import { PiArrowLeft } from 'react-icons/pi';

interface Props {
  title: string;
  position: 'top-left' | 'bottom-right';
  link?: string;
}

const VectorCombined = ({ title, position, link }: Props) => {
  const isTopLeft = position === 'top-left';

  return (
    <div
      className={`relative bg-background ${
        isTopLeft ? 'rounded-br-[18px]' : 'rounded-tl-[18px]'
      }`}
    >
      <div className={`pt-3 px-4 pb-2 ${isTopLeft ? 'pb-3' : 'pt-2'}`}>
        {link ? (
          <Link href='/' className='text-sm font-light flex items-center gap-2'>
            <PiArrowLeft size={14} />
            <p>{title}</p>
          </Link>
        ) : (
          <p className='text-sm font-light'>{title}</p>
        )}
      </div>

      <div
        className={`absolute size-4.5 ${
          isTopLeft ? 'top-0 -right-4.5' : '-left-4.5 bottom-0 rotate-180'
        }`}
      >
        <Graphic />
      </div>

      <div
        className={`absolute size-4.5 ${
          isTopLeft ? '' : '-top-4.5 right-0 rotate-180'
        }`}
      >
        <Graphic />
      </div>
    </div>
  );
};

export default VectorCombined;
