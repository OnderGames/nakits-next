"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  formatPriceInputDisplay,
  parsePriceInput
} from "@/lib/categories";
import {
  listingCanRepublishFromSold,
  MAX_LISTINGS_PER_USER
} from "@/lib/listing-policy";
import {
  countSellerOpenListings,
  fetchMyListings,
  removeListingImagesFolderFromStorage
} from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export default function MyListingsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [republishingId, setRepublishingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [listingTab, setListingTab] = useState<"on" | "off">("on");

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb || !hasSupabaseConfig) {
      setLoggedIn(false);
      setLoaded(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setLoggedIn(Boolean(uid));
      setUserId(uid);
      if (!uid) setLoaded(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setLoggedIn(Boolean(uid));
      setUserId(uid);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setLoaded(false);
    void fetchMyListings(sb, userId)
      .then(setItems)
      .finally(() => setLoaded(true));
  }, [userId]);

  const handleSavePrice = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      const sb = getSupabaseBrowser();
      if (!sb) return;
      const listing = items.find((x) => x.id === listingId);
      if (!listing) return;
      const raw =
        priceDrafts[listingId] ?? formatPriceInputDisplay(listing.price);
      const price = parsePriceInput(raw);
      if (!Number.isFinite(price) || price < 0) {
        setDeleteError("Geçerli bir fiyat girin.");
        return;
      }
      setDeleteError("");
      setSavingPriceId(listingId);
      try {
        const { error } = await sb
          .from("listings")
          .update({ price })
          .eq("id", listingId)
          .eq("seller_id", userId);
        if (error) {
          setDeleteError(error.message);
          return;
        }
        setItems((prev) =>
          prev.map((x) => (x.id === listingId ? { ...x, price } : x))
        );
        setPriceDrafts((prev) => {
          const next = { ...prev };
          delete next[listingId];
          return next;
        });
      } finally {
        setSavingPriceId(null);
      }
    },
    [userId, items, priceDrafts]
  );

  const handleRepublish = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      const listing = items.find((x) => x.id === listingId);
      if (
        !listing?.expiresAt ||
        !listingCanRepublishFromSold(listing.expiresAt)
      ) {
        setDeleteError(
          "Bu ilanın yayın süresi dolmuş; tekrar yayına alınamaz. Yeni ilan verebilirsiniz."
        );
        return;
      }
      const sb = getSupabaseBrowser();
      if (!sb) return;
      const open = await countSellerOpenListings(sb, userId);
      if (open >= MAX_LISTINGS_PER_USER) {
        setDeleteError(
          `Tekrar yayına almak için yer açın: en fazla ${MAX_LISTINGS_PER_USER} onay bekleyen veya yayındaki ilanınız olabilir.`
        );
        return;
      }
      setDeleteError("");
      setRepublishingId(listingId);
      try {
        const { error } = await sb
          .from("listings")
          .update({ status: "active" })
          .eq("id", listingId)
          .eq("seller_id", userId)
          .eq("status", "sold");
        if (error) {
          setDeleteError(error.message);
          return;
        }
        setItems((prev) =>
          prev.map((x) =>
            x.id === listingId ? { ...x, status: "active" } : x
          )
        );
      } finally {
        setRepublishingId(null);
      }
    },
    [userId, items]
  );

  const handleMarkSold = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      if (
        !window.confirm(
          "İlan vitrinden kalkacak (satıldı). Orijinal bitiş tarihiniz aynı kalır; yanlışlıkla işaretlediyseniz süre dolmadan «Tekrar yayına al» ile geri alabilirsiniz."
        )
      ) {
        return;
      }
      const sb = getSupabaseBrowser();
      if (!sb) return;
      setDeleteError("");
      setMarkingSoldId(listingId);
      try {
        const { error } = await sb
          .from("listings")
          .update({ status: "sold" })
          .eq("id", listingId)
          .eq("seller_id", userId);
        if (error) {
          setDeleteError(error.message);
          return;
        }
        setItems((prev) =>
          prev.map((x) =>
            x.id === listingId ? { ...x, status: "sold" } : x
          )
        );
      } finally {
        setMarkingSoldId(null);
      }
    },
    [userId]
  );

  const handleDeleteListing = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      if (
        !window.confirm(
          "Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        )
      ) {
        return;
      }
      const sb = getSupabaseBrowser();
      if (!sb) return;
      setDeleteError("");
      setDeletingId(listingId);
      try {
        await removeListingImagesFolderFromStorage(sb, userId, listingId);
        const { error } = await sb.from("listings").delete().eq("id", listingId);
        if (error) {
          setDeleteError(error.message);
          return;
        }
        setItems((prev) => prev.filter((x) => x.id !== listingId));
      } finally {
        setDeletingId(null);
      }
    },
    [userId]
  );

  const onAirListings = useMemo(
    () => items.filter((x) => x.status === "active"),
    [items]
  );
  const offAirListings = useMemo(
    () => items.filter((x) => x.status !== "active"),
    [items]
  );
  const displayedListings =
    listingTab === "on" ? onAirListings : offAirListings;

  if (loggedIn === null) {
    return (
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan yönetimi</h1>
        <p className="notice">Supabase yapılandırması yok; oturum özelliği devre dışı.</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan yönetimi</h1>
        <section className="panel">
          <p>İlanlarını görmek için giriş yapmalısın.</p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }} href="/login?next=/ilanlarim">
            Giriş yap
          </Link>
        </section>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan yönetimi</h1>
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="account-page">
      <h1 className="section-title">İlan yönetimi</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        Hesabınızda en fazla <strong>3</strong> onay bekleyen veya yayındaki ilan
        olabilir. Yayında kalan ilanlar <strong>30 gün</strong> sonra otomatik
        silinir. «Satıldı» dediğinizde süre sayacı durmaz; süre bitmeden tek
        tıkla tekrar yayına alabilirsiniz. Onay bekleyen, yayındaki veya satıldı
        (süresi devam eden) ilanlarda fiyatı karttan veya düzenle sayfasından
        güncelleyebilirsiniz.
      </p>
      {deleteError && (
        <p
          className="notice"
          style={{
            marginBottom: 14,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {deleteError}
        </p>
      )}
      {items.length === 0 ? (
        <section className="panel">
          <p>Henüz ilan vermedin.</p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }} href="/add-listing">
            İlan ver
          </Link>
        </section>
      ) : (
        <>
          <div className="account-tabs" role="tablist" aria-label="İlan durumu">
            <button
              type="button"
              role="tab"
              aria-selected={listingTab === "on"}
              className={
                listingTab === "on"
                  ? "account-tabs__btn account-tabs__btn--active"
                  : "account-tabs__btn"
              }
              onClick={() => setListingTab("on")}
            >
              Yayında olan ({onAirListings.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listingTab === "off"}
              className={
                listingTab === "off"
                  ? "account-tabs__btn account-tabs__btn--active"
                  : "account-tabs__btn"
              }
              onClick={() => setListingTab("off")}
            >
              Yayında olmayan ({offAirListings.length})
            </button>
          </div>
          {displayedListings.length === 0 ? (
            <section className="panel">
              <p className="meta" style={{ margin: 0 }}>
                {listingTab === "on"
                  ? "Şu an yayındaki ilanın yok (onay bekleyen veya satıldı / süresi dolmuş ilanlar «Yayında olmayan» sekmesinde)."
                  : "Bu grupta ilan yok."}
              </p>
            </section>
          ) : (
        <section className="cards">
          {displayedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              ownerToolbar={{
                editHref: `/ilanlarim/${listing.id}/duzenle`,
                onDelete: () => void handleDeleteListing(listing.id),
                onMarkSold: () => void handleMarkSold(listing.id),
                markSoldBusy: markingSoldId === listing.id,
                onRepublish:
                  listing.status === "sold"
                    ? () => void handleRepublish(listing.id)
                    : undefined,
                republishBusy: republishingId === listing.id,
                busy: deletingId === listing.id,
                ...(listing.status === "pending" ||
                listing.status === "active" ||
                listing.status === "sold"
                  ? {
                      priceQuickEdit: {
                        value:
                          priceDrafts[listing.id] ??
                          formatPriceInputDisplay(listing.price),
                        onChange: (v) =>
                          setPriceDrafts((prev) => ({
                            ...prev,
                            [listing.id]: v
                          })),
                        onSave: () => void handleSavePrice(listing.id),
                        saving: savingPriceId === listing.id
                      }
                    }
                  : {})
              }}
            />
          ))}
        </section>
          )}
        </>
      )}
      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/add-listing">Yeni ilan ver</Link>
      </p>
    </div>
  );
}
