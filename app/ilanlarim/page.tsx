"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  formatPriceInputDisplay,
  parsePriceInput
} from "@/lib/categories";
import { fetchMyListings } from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

async function removeListingFolderFromStorage(
  sb: SupabaseClient,
  userId: string,
  listingId: string
) {
  const folder = `${userId}/${listingId}`;
  const { data: files, error: listErr } = await sb.storage
    .from("listing-images")
    .list(folder);
  if (listErr || !files?.length) return;
  const paths = files.map((f) => `${folder}/${f.name}`);
  await sb.storage.from("listing-images").remove(paths);
}

export default function MyListingsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

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

  const handleMarkSold = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      if (
        !window.confirm(
          "Bu ilanı «satıldı» olarak işaretlemek istiyor musunuz? İlan vitrinden kalkacak; silinmez, istediğiniz zaman ilanlarımdan silebilirsiniz."
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
        await removeListingFolderFromStorage(sb, userId, listingId);
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

  if (loggedIn === null) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <p className="notice">Supabase yapılandırması yok; oturum özelliği devre dışı.</p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <section className="panel">
          <p>İlanlarını görmek için giriş yapmalısın.</p>
          <Link className="btn btn-primary" style={{ display: "inline-block", marginTop: 12 }} href="/login?next=/ilanlarim">
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="container">
        <h1 className="section-title">İlanlarım</h1>
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="section-title">İlanlarım</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        Hesabınızda en fazla <strong>3</strong> onay bekleyen veya yayındaki ilan
        olabilir. Yayında kalan ilanlar <strong>30 gün</strong> sonra otomatik
        silinir (satıldı veya reddedilenler bu süreye göre silinmez). Onay
        bekleyen veya yayındaki ilanlarda fiyatı karttan veya düzenle sayfasından
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
        <section className="cards">
          {items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              ownerToolbar={{
                editHref: `/ilanlarim/${listing.id}/duzenle`,
                onDelete: () => void handleDeleteListing(listing.id),
                onMarkSold: () => void handleMarkSold(listing.id),
                markSoldBusy: markingSoldId === listing.id,
                busy: deletingId === listing.id,
                ...(listing.status === "pending" || listing.status === "active"
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
      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/add-listing">Yeni ilan ver</Link>
      </p>
    </main>
  );
}
