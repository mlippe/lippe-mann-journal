"use client";

import { useRouter } from "next/navigation";
import BlurImage from "@/components/blur-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { type Collection } from "@/db/schema";
import VectorTopLeftAnimation from "./vector-top-left-animation";

interface Props {
  collection: Collection;
}

const CityCard = ({ collection }: Props) => {
  const router = useRouter();

  return (
    <div
      className="w-full relative group cursor-pointer"
      onClick={() => router.push(`/collection/${collection.slug}`)}
    >
      <AspectRatio
        ratio={0.75 / 1}
        className="overflow-hidden rounded-lg relative"
      >
        <BlurImage
          src={collection.coverImageUrl || ''}
          alt={collection.name}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
          quality={65}
          className="object-cover lg:group-hover:blur-xs lg:transition-[filter] lg:duration-300 lg:ease-out"
          blurhash={""} // Blurhash not available on collection directly, will need to be fetched with cover image or set to a default
        />
      </AspectRatio>

      <div className="absolute top-0 left-0 z-20">
        <VectorTopLeftAnimation title={collection.name} />
      </div>
    </div>
  );
};

export default CityCard;
