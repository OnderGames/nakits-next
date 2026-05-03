"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useFavorites } from "@/components/FavoritesProvider";

type Props = {
  listingId: string;
  /** Kendi ilanında favori gösterme */
  sellerId?: string | null;
  variant: "vitrin" | "browse" | "detail";
  /** Ek sınıf */
  className?: string;
};

export default function FavoriteHeartButton({
  listingId,
  sellerId,
  variant,
  className = ""
}: Props) {
  const fav = useFavorites();
  const [myUserId, setMyUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setMyUserId(null);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setMyUserId(null);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setMyUserId(data.session?.user?.id ?? null);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setMyUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const filled = fav?.ready ? fav.isFavorite(listingId) : false;
  const busy = !fav?.ready;

  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!fav || !hasSupabaseConfig) return;
      await fav.toggle(listingId);
    },
    [fav, listingId]
  );

  if (!hasSupabaseConfig) {
    return null;
  }

  if (sellerId && myUserId && sellerId === myUserId) {
    return null;
  }

  const cls = [
    "favorite-heart",
    `favorite-heart--${variant}`,
    filled ? "favorite-heart--active" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      onClick={(e) => void onClick(e)}
      disabled={busy}
      aria-pressed={filled}
      aria-label={filled ? "Favorilerden çıkar" : "Favorilere ekle"}
      title={filled ? "Favorilerden çıkar" : "Favorilere ekle"}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 21s-6.716-4.432-9-8.5C.89 9.732 2.14 6 6 6c2.352 0 3.638 1.352 4 2 .362-.648 1.648-2 4-2 3.86 0 5.11 3.732 3 6.5C16.716 16.568 12 21 12 21z"
          stroke="currentColor"
          strokeWidth="1.75"
          fill={filled ? "currentColor" : "rgba(255,255,255,0.92)"}
        />
      </svg>
    </button>
  );
}
