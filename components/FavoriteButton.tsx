"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

interface FavoriteButtonProps {
  propertyId: number;
}

export default function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function checkFavoriteStatus() {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorited(true);
      }
    }

    checkFavoriteStatus();
  }, [propertyId, user, authLoading]);

  const toggleFavorite = async () => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      if (isFavorited) {
        // Remove bookmark
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("property_id", propertyId)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsFavorited(false);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("favorites")
          .insert({
            property_id: propertyId,
            user_id: user.id,
          });

        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Failed to update favorite status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggleFavorite} disabled={loading} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all shadow-sm ${
        isFavorited
          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      <svg className={`w-4 h-4 transition-transform ${isFavorited ? "fill-current text-red-600 scale-110" : "text-gray-400"}`} fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {isFavorited ? "Saved" : "Save Listing"}
    </button>
  );
}