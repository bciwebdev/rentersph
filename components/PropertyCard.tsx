"use client";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Property = {
  id: number;
  title: string;
  property_type: string;
  price: number;
  address: string;
  cover_image: string | null;
  is_featured: boolean;
};

export default function PropertyCard({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();

  async function deleteProperty() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", property.id);

    if (error) {
      alert("Failed to delete property.");
      return;
    }

    router.refresh();
  }

  async function boostProperty() {
    const { error } = await supabase
      .from("properties")
      .update({
        is_featured: true,
      })
      .eq("id", property.id);

    if (error) {
      alert("Failed to boost property.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      {/* Featured Badge */}

      {property.is_featured && (
        <div className="absolute z-10 m-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
          FEATURED
        </div>
      )}

      {/* Image */}

      <div className="relative h-52 w-full bg-gray-200">
        {property.cover_image ? (
          <Image
            src={property.cover_image}
            alt={property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}
      </div>

      {/* Content */}

      <div className="space-y-3 p-5">

        <div>
          <h3 className="line-clamp-1 text-xl font-bold">
            {property.title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {property.address}
          </p>
        </div>

        <div className="text-2xl font-bold text-blue-600">
          ₱{Number(property.price).toLocaleString()}
          <span className="ml-1 text-sm font-normal text-gray-500">
            / month
          </span>
        </div>

        <div className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {property.property_type}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">

          <Link
            href={`/property/${property.id}`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View
          </Link>

          <button
            onClick={boostProperty}
            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
          >
            Boost
          </button>

          <button
            onClick={deleteProperty}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}