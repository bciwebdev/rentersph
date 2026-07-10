"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
};

export default function ImageGallery({ images }: Props) {
  const [selected, setSelected] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[450px] w-full overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={images[selected]}
          alt="property"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
              selected === index
                ? "border-blue-600"
                : "border-transparent"
            }`}
          >
            <Image src={img} alt="thumb" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}