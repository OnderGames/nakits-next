"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type FavoritesContextValue = {
  ready: boolean;
  ids: ReadonlySet<string>;
  isFavorite: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites(): FavoritesContextValue | null {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }

    const client = sb;
    let cancelled = false;

    async function load() {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setIds(new Set());
        setReady(true);
        return;
      }
      const { data } = await client.from("favorites").select("listing_id");
      if (cancelled) return;
      setIds(
        new Set(
          (data ?? []).map((r) => String((r as { listing_id: string }).listing_id))
        )
      );
      setReady(true);
    }

    void load();
    const {
      data: { subscription }
    } = client.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const toggle = useCallback(
    async (listingId: string) => {
      if (!hasSupabaseConfig) return;
      const sb = getSupabaseBrowser();
      if (!sb) return;
      const {
        data: { session }
      } = await sb.auth.getSession();
      if (!session?.user) {
        const path =
          typeof window !== "undefined"
            ? window.location.pathname +
              (window.location.search ? window.location.search : "")
            : "/";
        router.push(`/login?next=${encodeURIComponent(path)}`);
        return;
      }
      const uid = session.user.id;
      const currently = idsRef.current.has(listingId);
      if (currently) {
        const { error } = await sb
          .from("favorites")
          .delete()
          .match({ profile_id: uid, listing_id: listingId });
        if (!error) {
          setIds((prev) => {
            const n = new Set(prev);
            n.delete(listingId);
            return n;
          });
        }
      } else {
        const { error } = await sb.from("favorites").insert({
          profile_id: uid,
          listing_id: listingId
        });
        if (!error) {
          setIds((prev) => new Set(prev).add(listingId));
        }
      }
    },
    [router]
  );

  const isFavorite = useCallback((listingId: string) => ids.has(listingId), [ids]);

  const value = useMemo(
    () => ({
      ready,
      ids,
      isFavorite,
      toggle
    }),
    [ready, ids, isFavorite, toggle]
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}
