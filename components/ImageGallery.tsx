"use client";

import { useState } from "react";

type Props = {
  images: string[];
};

export default function ImageGallery({ images }: Props) {
  const [selected, setSelected] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-80 w-full bg-gray-200 flex items-center justify-center">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MAIN IMAGE */}
      <div className="h-[400px] w-full overflow-hidden rounded-xl border">
        <img
          src={images[selected]}
          className="h-full w-full object-cover"
          alt="Property"
        />
      </div>

      {/* THUMBNAILS */}
      <div className="flex gap-3 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded border ${
              selected === index
                ? "border-blue-600"
                : "border-gray-300"
            }`}
          >
            <img
              src={img}
              className="h-full w-full object-cover"
              alt="thumb"
            />
          </button>
        ))}
      </div>
    </div>
  );
}