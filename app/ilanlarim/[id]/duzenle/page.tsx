"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  parseCategoryKey,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import {
  fetchListingForEdit,
  type ListingForEdit
} from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import {
  TURKEY_PROVINCE_COUNT,
  TURKEY_PROVINCES
} from "@/lib/turkish-provinces";

function fileExtension(file: File): string {
  const n = file.name;
  const i = n.lastIndexOf(".");
  if (i > 0 && i < n.length - 1) {
    const ext = n
      .slice(i + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8);
    if (ext) return ext;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

function mapListingUpdateError(message: string | undefined): string {
  if (!message) return "İlan güncellenemedi.";
  const lower = message.toLowerCase();
  if (
    lower.includes("show_phone_on_listing") ||
    (lower.includes("schema cache") && lower.includes("listings"))
  ) {
    return "Veritabanı şeması güncel değil. Supabase SQL Editor’da `sql/migration_listing_show_phone.sql` dosyasını çalıştırın.";
  }
  if (message.includes("row-level security")) {
    return "İşlem reddedildi. Oturumunuzu kontrol edin.";
  }
  return message;
}

function storagePathFromListingPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    const i = segs.indexOf("listing-images");
    if (i === -1 || i >= segs.length - 1) return null;
    return segs.slice(i + 1).join("/");
  } catch {
    return null;
  }
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const listingId = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [listingFetchDone, setListingFetchDone] = useState(false);
  const [listing, setListing] = useState<ListingForEdit | null>(null);
  const [groupSlug, setGroupSlug] = useState("");
  const [detailCategoryKey, setDetailCategoryKey] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [showPhoneOnListing, setShowPhoneOnListing] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setAuthReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setAuthReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!authReady || !hasSupabaseConfig) return;
    if (!listingId) {
      setListing(null);
      setListingFetchDone(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setListingFetchDone(true);
      return;
    }
    if (!user) {
      setListing(null);
      setListingFetchDone(true);
      return;
    }
    let cancelled = false;
    setListingFetchDone(false);
    void (async () => {
      const row = await fetchListingForEdit(sb, listingId);
      if (cancelled) return;
      if (!row || row.sellerId !== user.id) {
        setListing(null);
        setListingFetchDone(true);
        return;
      }
      setListing(row);
      const parsed = parseCategoryKey(row.categoryKey);
      if (parsed) {
        setGroupSlug(parsed.group.slug);
        setDetailCategoryKey(row.categoryKey);
      } else {
        setGroupSlug("");
        setDetailCategoryKey("");
      }
      setCondition(row.condition);
      setShowPhoneOnListing(row.showPhoneOnListing);
      setListingFetchDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, listingId, user]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb || !user || !listing) {
      setError("Oturum veya ilan bilgisi eksik.");
      return;
    }
    if (!detailCategoryKey) {
      setError("Ana ve alt kategori seçin.");
      return;
    }

    const fd = new FormData(event.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const priceRaw = String(fd.get("price") ?? "").trim();
    const price = parseFloat(priceRaw.replace(",", "."));
    const photo = fd.get("photo");

    if (!title || !description || !city) {
      setError("Başlık, açıklama ve şehir zorunludur.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }

    const sqlSlug = sqlCategorySlugFromKey(detailCategoryKey);
    setSubmitting(true);

    const { data: catRow, error: catErr } = await sb
      .from("categories")
      .select("id")
      .eq("slug", sqlSlug)
      .maybeSingle();

    if (catErr || !catRow?.id) {
      setSubmitting(false);
      setError("Kategori bulunamadı.");
      return;
    }

    const { error: upErr } = await sb
      .from("listings")
      .update({
        title,
        description,
        price,
        city,
        condition,
        show_phone_on_listing: showPhoneOnListing,
        category_id: catRow.id
      })
      .eq("id", listing.id)
      .eq("seller_id", user.id);

    if (upErr) {
      setSubmitting(false);
      setError(mapListingUpdateError(upErr.message));
      return;
    }

    const newFile = photo instanceof File && photo.size > 0 ? photo : null;
    if (newFile) {
      const ext = fileExtension(newFile);
      const storagePath = `${user.id}/${listing.id}/0.${ext}`;
      const oldPath = storagePathFromListingPublicUrl(listing.coverImageUrl);

      const { error: upPhotoErr } = await sb.storage
        .from("listing-images")
        .upload(storagePath, newFile, {
          contentType: newFile.type || "image/jpeg",
          upsert: true
        });

      if (upPhotoErr) {
        setSubmitting(false);
        setError("Yeni fotoğraf yüklenemedi. İlan metni kaydedildi.");
        return;
      }

      const {
        data: { publicUrl }
      } = sb.storage.from("listing-images").getPublicUrl(storagePath);

      const { data: imgRow } = await sb
        .from("listing_images")
        .select("id")
        .eq("listing_id", listing.id)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (imgRow?.id) {
        await sb
          .from("listing_images")
          .update({ image_url: publicUrl })
          .eq("id", imgRow.id);
      } else {
        await sb.from("listing_images").insert({
          listing_id: listing.id,
          image_url: publicUrl,
          sort_order: 0
        });
      }

      if (oldPath && oldPath !== storagePath) {
        await sb.storage.from("listing-images").remove([oldPath]);
      }
    }

    setSubmitting(false);
    setNotice("İlanın güncellendi.");
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    void router.refresh();
  }

  if (!authReady) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">İlan düzenle</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <h1 className="section-title">İlan düzenle</h1>
        <section className="panel">
          <p>Düzenlemek için giriş yapın.</p>
          <Link
            className="btn btn-primary"
            style={{ display: "inline-block", marginTop: 12 }}
            href={`/login?next=/ilanlarim/${listingId}/duzenle`}
          >
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  if (user && !listingFetchDone) {
    return (
      <main className="container">
        <h1 className="section-title">İlan düzenle</h1>
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (listing === null) {
    return (
      <main className="container">
        <h1 className="section-title">İlan düzenle</h1>
        <section className="panel">
          <p>Bu ilan yok veya bu ilanı düzenleme yetkiniz bulunmuyor.</p>
          <Link href="/ilanlarim">İlanlarıma dön</Link>
        </section>
      </main>
    );
  }

  const displayImageSrc = photoPreview ?? listing.coverImageUrl;
  const showBlobPreview = displayImageSrc.startsWith("blob:");

  return (
    <main className="container">
      <h1 className="section-title">İlan düzenle</h1>
      <p className="meta" style={{ marginBottom: 14 }}>
        <Link href="/ilanlarim">← İlanlarım</Link>
        {listing.status && (
          <>
            {" "}
            · Durum:{" "}
            {listing.status === "pending"
              ? "Onay bekliyor"
              : listing.status === "active"
                ? "Yayında"
                : listing.status === "sold"
                  ? "Satıldı"
                  : listing.status === "rejected"
                    ? "Yayınlanmadı"
                    : listing.status}
          </>
        )}
      </p>

      <section className="panel">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="row">
            <div>
              <label htmlFor="edit-title">Başlık</label>
              <input
                id="edit-title"
                name="title"
                required
                type="text"
                defaultValue={listing.title}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="edit-price">Fiyat</label>
              <input
                id="edit-price"
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={listing.price}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label>Ana kategori</label>
              <select
                required
                value={groupSlug}
                disabled={submitting}
                onChange={(event) => {
                  setGroupSlug(event.target.value);
                  setDetailCategoryKey("");
                }}
              >
                <option value="">Seçiniz</option>
                {CATEGORY_GROUPS.map((group) => (
                  <option key={group.slug} value={group.slug}>
                    {group.emoji} {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Alt kategori</label>
              <select
                required
                disabled={!groupSlug || submitting}
                value={detailCategoryKey}
                onChange={(event) => setDetailCategoryKey(event.target.value)}
              >
                <option value="">Seçiniz</option>
                {(selectedGroup?.subs ?? []).map((sub) => (
                  <option
                    key={sub.slug}
                    value={compositeCategoryKey(
                      selectedGroup!.slug,
                      sub.slug
                    )}
                  >
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label htmlFor="edit-city">
                Şehir{" "}
                <span className="meta" style={{ fontWeight: 400 }}>
                  ({TURKEY_PROVINCE_COUNT} il)
                </span>
              </label>
              <select
                id="edit-city"
                name="city"
                required
                defaultValue={listing.city}
                disabled={submitting}
              >
                <option value="">Seçiniz</option>
                {TURKEY_PROVINCES.map((il) => (
                  <option key={il} value={il}>
                    {il}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-condition">Durum</label>
              <select
                id="edit-condition"
                value={condition}
                disabled={submitting}
                onChange={(e) =>
                  setCondition(e.target.value === "new" ? "new" : "used")
                }
              >
                <option value="used">İkinci el</option>
                <option value="new">Sıfır</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="edit-desc">Açıklama</label>
            <textarea
              id="edit-desc"
              name="description"
              required
              rows={6}
              defaultValue={listing.description}
              disabled={submitting}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="edit-photo">Fotoğraf (değiştirmek için seçin)</label>
            <input
              id="edit-photo"
              name="photo"
              type="file"
              accept="image/*"
              disabled={submitting}
              onChange={handlePhotoChange}
            />
            <div style={{ marginTop: 10, position: "relative", width: "100%", maxHeight: 220 }}>
              {showBlobPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob önizleme
                <img
                  src={displayImageSrc}
                  alt="İlan görseli"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 10
                  }}
                />
              ) : (
                <Image
                  src={displayImageSrc}
                  alt="İlan görseli"
                  width={900}
                  height={400}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 10
                  }}
                />
              )}
            </div>
          </div>

          <label
            style={{
              marginTop: 14,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              cursor: submitting ? "default" : "pointer",
              lineHeight: 1.45
            }}
          >
            <input
              type="checkbox"
              checked={showPhoneOnListing}
              disabled={submitting}
              onChange={(e) => setShowPhoneOnListing(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span className="meta" style={{ fontSize: 14, color: "var(--text)" }}>
              İlanda telefon numaram görünsün (profilde kayıtlı numara kullanılır).
            </span>
          </label>

          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
          {error && (
            <p
              className="notice"
              style={{
                marginTop: 10,
                background: "#fee2e2",
                borderColor: "#fecaca",
                color: "#7f1d1d"
              }}
            >
              {error}
            </p>
          )}
          {notice && (
            <p className="notice" style={{ marginTop: 10 }}>
              {notice}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
