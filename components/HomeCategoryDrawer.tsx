"use client";

import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import { buildListingCountsByCategoryKey } from "@/lib/category-counts";
import { fetchPublicListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { HOME_CATEGORY_DRAWER_OPEN_EVENT } from "@/lib/open-home-category-drawer";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, MouseEvent } from "react";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";

async function resolveCategoryCounts(): Promise<Record<string, number>> {
  if (hasSupabaseConfig) {
    const sb = getSupabaseBrowser();
    if (sb) {
      const listings = await fetchPublicListings(sb);
      return buildListingCountsByCategoryKey(listings);
    }
  }
  return buildListingCountsByCategoryKey(mockListings);
}

function HomeCategoryDrawerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);
  const countsFetchedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  const preserveParams = useMemo(() => {
    const qp = searchParams.get("q")?.trim();
    const city = searchParams.get("city") ?? undefined;
    const district = searchParams.get("district") ?? undefined;
    if (!qp && !city && !district) return null;
    return {
      q: qp || undefined,
      city,
      district
    };
  }, [searchParams]);

  const selectedCategoryKey = searchParams.get("category")?.trim() || null;

  const close = useCallback(() => {
    setOpen(false);
    prevActiveRef.current?.focus?.();
    prevActiveRef.current = null;
  }, []);

  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [open, close]);

  useEffect(() => {
    function onOpen() {
      prevActiveRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    }
    window.addEventListener(
      HOME_CATEGORY_DRAWER_OPEN_EVENT,
      onOpen as EventListener
    );
    return () =>
      window.removeEventListener(
        HOME_CATEGORY_DRAWER_OPEN_EVENT,
        onOpen as EventListener
      );
  }, []);

  useEffect(() => {
    if (!open || countsFetchedRef.current) return;

    let cancelled = false;

    async function run() {
      setCountsLoading(true);
      try {
        const next = await resolveCategoryCounts();
        if (!cancelled) setCounts(next);
      } catch {
        if (!cancelled) {
          setCounts(buildListingCountsByCategoryKey(mockListings));
        }
      } finally {
        if (!cancelled) {
          setCountsLoading(false);
          countsFetchedRef.current = true;
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submitKeyword(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(
      trimmed ? `/listings?q=${encodeURIComponent(trimmed)}` : "/listings"
    );
    close();
    setQ("");
  }

  function onAllListingsClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    router.push("/listings");
    close();
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="home-category-drawer__backdrop"
        aria-label="Kategoriler panelini kapat"
        tabIndex={-1}
        onClick={close}
      />
      <section
        className="home-category-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-category-drawer__top">
          <h2 id={titleId} className="home-category-drawer__title">
            Kategoriler
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="home-category-drawer__close"
            onClick={close}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <form
          className="home-category-drawer__search"
          onSubmit={submitKeyword}
          role="search"
          aria-label="İlan ara"
        >
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kelime ile ara…"
            autoComplete="off"
            maxLength={120}
            enterKeyHint="search"
            className="home-category-drawer__search-input"
          />
          <button type="submit" className="home-category-drawer__search-go">
            Ara
          </button>
        </form>

        <p className="home-category-drawer__hint meta">
          <Link href="/listings" onClick={onAllListingsClick}>
            Tüm ilanlar — şehir ve ilçe filtresi
          </Link>
        </p>

        <div className="home-category-drawer__scroll">
          {countsLoading ? (
            <p className="home-category-drawer__loading meta" role="status">
              Kategoriler yükleniyor…
            </p>
          ) : null}
          <div className="home-category-drawer__sidebar-mount">
            <HomeCategorySidebar
              counts={counts}
              embedded
              preserveParams={preserveParams}
              selectedCategoryKey={selectedCategoryKey}
              onCategoryNavigate={close}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Mobilde tüm sayfalarda: soldan kategori paneli.
 * Sayfa değiştirmeden açılır; kategori seçilince kapanır ve `/listings?category=…` listelenir.
 */
export default function HomeCategoryDrawer() {
  return (
    <Suspense fallback={null}>
      <HomeCategoryDrawerContent />
    </Suspense>
  );
}
