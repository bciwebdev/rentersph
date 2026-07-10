"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

interface Property {
  id: number;
  title: string;
  property_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  address: string;
  cover_image: string | null;
}

interface FavoriteItem {
  id: string;
  properties: Property | null;
}

// 1. Move the core view logic to a separate inner function component
function FavoritesContent() {
  const { user, loading: authLoading } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("favorites")
        .select(`
          id,
          properties (
            id,
            title,
            property_type,
            price,
            bedrooms,
            bathrooms,
            area,
            address,
            cover_image
          )
        `)
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;
      setFavorites((data as unknown as FavoriteItem[]) || []);
    } catch (err: any) {
      setError(err.message || "Could not pull your favorited listings database list.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("property_id", propertyId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
      setFavorites((prev) => prev.filter((item) => item.properties?.id !== propertyId));
    } catch (err: any) {
      console.error("Error removing favorite record item:", err);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Saved Properties</h1>
        <p className="text-sm text-gray-500 mt-1">Keep track of the rental listings you are considering.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="text-center bg-white border border-gray-200 rounded-xl p-16 shadow-sm max-w-xl mx-auto mt-8">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Your shortlist is empty</h3>
          <p className="text-gray-500 text-xs mb-5">Click "Save Listing" on any item properties details page to organize your options here.</p>
          <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors">
            Explore Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => {
            const property = item.properties;
            if (!property) return null;

            return (
              <Link key={property.id} href={`/properties/${property.id}`} className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
                <div className="relative aspect-[16/10] bg-gray-100">
                  {property.cover_image ? (
                    <Image src={property.cover_image} alt={property.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-200" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <button onClick={(e) => handleRemoveFavorite(property.id, e)} className="absolute top-3 right-3 bg-white hover:bg-red-50 p-2 rounded-full border border-gray-100 shadow-sm transition-colors text-gray-400 hover:text-red-500 group/btn" title="Remove selection">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-lg font-extrabold text-indigo-600">₱{property.price.toLocaleString()}</span>
                      <span className="text-gray-500 text-[10px] ml-0.5">/ month</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-indigo-600 transition-colors mb-1">{property.title}</h3>
                    <p className="text-gray-500 text-xs line-clamp-1 mb-3">{property.address}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-3 border-t border-gray-100">
                    <span>{property.bedrooms} BR</span>
                    <span>{property.bathrooms} BA</span>
                    <span>{property.area} sqm</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

// 2. Export the main default component wrapped completely in Suspense
export default function FavoritesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <FavoritesContent />
    </Suspense>
  );
}