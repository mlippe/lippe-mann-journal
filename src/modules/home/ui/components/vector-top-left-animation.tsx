import Graphic from '@/components/graphic';
import { PiArrowRight } from 'react-icons/pi';

interface Props {
  title: string;
}

const VectorTopLeftAnimation = ({ title }: Props) => {
  return (
    <div className='relative bg-background rounded-br-[18px]'>
      <div className='pt-2 px-4 pb-3 overflow-hidden'>
        <div className='text-sm font-light flex items-center'>
          <p>{title}</p>
          <div className='w-0 group-hover:w-6 transition-[width] duration-300 ease-out overflow-hidden'>
            <PiArrowRight size={14} className='ml-2 shrink-0' />
          </div>
        </div>
      </div>

      <div className='absolute size-4.5'>
        <Graphic />
      </div>

      <div className='absolute size-4.5 top-0 -right-4.5'>
        <Graphic />
      </div>
    </div>
  );
};

export default VectorTopLeftAnimation;
