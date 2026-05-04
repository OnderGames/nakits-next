"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type Props = {
  sellerId?: string;
  favoriteCount?: number;
};

/** Yalnızca ilan sahibi görür: kaç kullanıcı favoriye eklemiş. */
export default function ListingOwnerFavoriteStat({
  sellerId,
  favoriteCount
}: Props) {
  const [viewerIsSeller, setViewerIsSeller] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig || !sellerId || favoriteCount === undefined) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => {
      setViewerIsSeller(data.session?.user?.id === sellerId);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setViewerIsSeller(session?.user?.id === sellerId);
    });
    return () => subscription.unsubscribe();
  }, [sellerId, favoriteCount]);

  if (!viewerIsSeller || favoriteCount === undefined) return null;

  return (
    <p className="meta listing-owner-fav-stat">
      <span aria-hidden>♥</span>{" "}
      {favoriteCount === 0 ? (
        <>Henüz kimse ilanınızı favoriye eklemedi.</>
      ) : (
        <>
          Bu ilana <strong>{favoriteCount}</strong> kişi favoriye ekledi.
        </>
      )}
    </p>
  );
}
