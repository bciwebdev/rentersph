"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

interface FavoriteButtonProps {
  propertyId: number;
}

export default function FavoriteButton({
  propertyId,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();

  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    checkFavoriteStatus(user.id);
  }, [propertyId, user, authLoading]);

  async function checkFavoriteStatus(userId: string) {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setIsFavorited(true);
    } else {
      setIsFavorited(false);
    }
  }

  const toggleFavorite = async () => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const userId = user.id;

    setLoading(true);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("property_id", propertyId)
          .eq("user_id", userId);

        if (error) throw error;

        setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            property_id: propertyId,
            user_id: userId,
          });

        if (error) throw error;

        setIsFavorited(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all ${
        isFavorited
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <svg
        className={`h-4 w-4 transition-transform ${
          isFavorited
            ? "scale-110 fill-current text-red-600"
            : "text-gray-400"
        }`}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>

      {isFavorited ? "Saved" : "Save Listing"}
    </button>
  );
}