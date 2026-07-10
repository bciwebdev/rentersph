"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Property = {
  id: number;
  title: string;
  property_type: string;
  price: number;
  address: string;
  cover_image: string | null;
};

export default function RentersPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("SUPABASE ERROR:", error.message);
      setProperties([]);
      setFiltered([]);
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setFiltered(data || []);
    setLoading(false);
  }

  function handleSearch(filters: any) {
    let result = [...properties];

    if (filters?.query?.trim()) {
      const q = filters.query.toLowerCase();

      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }

    if (filters?.propertyType) {
      result = result.filter(
        (p) => p.property_type === filters.propertyType
      );
    }

    if (filters?.minPrice) {
      result = result.filter(
        (p) => p.price >= Number(filters.minPrice)
      );
    }

    if (filters?.maxPrice) {
      result = result.filter(
        (p) => p.price <= Number(filters.maxPrice)
      );
    }

    setFiltered(result);
  }

  return (
    <>
      <Navbar />
      <Hero />

      {/* SAFE VERSION (NO REQUIRED PROP TYPES) */}
      <SearchBar onSearch={handleSearch} />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="mb-6 text-3xl font-bold">
          Available Rentals
        </h2>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-gray-500">
            No properties found
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((property) => (
              <div
                key={property.id}
                className="border rounded-xl overflow-hidden"
              >
                <div className="h-40 bg-gray-200">
                  {property.cover_image && (
                    <img
                      src={property.cover_image}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold">
                    {property.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {property.address}
                  </p>

                  <p className="text-blue-600 font-semibold">
                    ₱{Number(property.price).toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-400">
                    {property.property_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}