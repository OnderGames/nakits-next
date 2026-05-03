"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  formatPriceInputDisplay,
  parseCategoryKey,
  parsePriceInput,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import {
  fetchListingForEdit,
  type ListingForEdit
} from "@/lib/listings-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getDistrictsForProvince } from "@/lib/turkish-districts";
import {
  TURKEY_PROVINCE_COUNT,
  TURKEY_PROVINCES
} from "@/lib/turkish-provinces";
import { MAX_LISTING_PHOTOS } from "@/lib/listing-photos";
import { resizeListingImageForUpload } from "@/lib/resize-listing-image";

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

function uploadContentType(file: File): string {
  const mime = (file.type || "").trim().toLowerCase();
  if (mime.startsWith("image/")) return mime;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif"
  };
  return map[ext] ?? "image/jpeg";
}

const IMAGE_NAME_PATTERN =
  /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tif|tiff)$/i;

function isLikelyImageFile(f: File): boolean {
  const mime = (f.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return IMAGE_NAME_PATTERN.test(f.name);
}

type EditSlide =
  | { kind: "existing"; rowId: string; url: string }
  | { kind: "new"; file: File; previewUrl: string };

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
  const [slides, setSlides] = useState<EditSlide[]>([]);
  const [removedExisting, setRemovedExisting] = useState<
    { rowId: string; url: string }[]
  >([]);
  const [galleryNormalizing, setGalleryNormalizing] = useState(false);
  const slidesRef = useRef<EditSlide[]>([]);
  slidesRef.current = slides;
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editPriceText, setEditPriceText] = useState("");

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
      slidesRef.current.forEach((s) => {
        if (s.kind === "new") URL.revokeObjectURL(s.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (!listing) return;
    setSlides((prev) => {
      prev.forEach((s) => {
        if (s.kind === "new") URL.revokeObjectURL(s.previewUrl);
      });
      return listing.galleryImages.map((g) => ({
        kind: "existing" as const,
        rowId: g.id,
        url: g.imageUrl
      }));
    });
    setRemovedExisting([]);
  }, [listing]);

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
      setEditCity(row.city);
      setEditDistrict(row.district ?? "");
      setEditPriceText(formatPriceInputDisplay(row.price));
      setListingFetchDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, listingId, user]);

  function removeSlideAt(index: number) {
    const target = slides[index];
    if (!target) return;
    if (target.kind === "existing") {
      setRemovedExisting((prev) => [
        ...prev,
        { rowId: target.rowId, url: target.url }
      ]);
    } else {
      URL.revokeObjectURL(target.previewUrl);
    }
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlide(fromIndex: number, delta: -1 | 1) {
    const toIndex = fromIndex + delta;
    setSlides((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  const handleGalleryPhotosChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = Array.from(event.target.files ?? []);
    const incoming = raw.filter(isLikelyImageFile);
    if (incoming.length === 0) {
      event.target.value = "";
      return;
    }
    setGalleryNormalizing(true);
    try {
      const resized = await Promise.all(
        incoming.map((f) => resizeListingImageForUpload(f))
      );
      setSlides((prev) => {
        const next = [...prev];
        for (const file of resized) {
          if (next.length >= MAX_LISTING_PHOTOS) break;
          next.push({
            kind: "new",
            file,
            previewUrl: URL.createObjectURL(file)
          });
        }
        return next;
      });
    } finally {
      setGalleryNormalizing(false);
      event.target.value = "";
    }
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
    const city = editCity.trim();
    const districtVal = editDistrict.trim();
    const price = parsePriceInput(editPriceText);

    if (!title || !description || !city) {
      setError("Başlık, açıklama ve şehir zorunludur.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    if (slides.length === 0) {
      setError("En az bir fotoğraf bulunmalıdır.");
      return;
    }
    if (slides.length > MAX_LISTING_PHOTOS) {
      setError(`En fazla ${MAX_LISTING_PHOTOS} fotoğraf ekleyebilirsiniz.`);
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
        district: districtVal || null,
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

    for (const r of removedExisting) {
      const { error: delImgErr } = await sb
        .from("listing_images")
        .delete()
        .eq("id", r.rowId);
      if (delImgErr) {
        setSubmitting(false);
        setError(
          `Fotoğraf silinemedi (metin kaydedildi): ${delImgErr.message}`
        );
        return;
      }
      const path = storagePathFromListingPublicUrl(r.url);
      if (path) {
        await sb.storage.from("listing-images").remove([path]);
      }
    }

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.kind === "existing") {
        const { error: sortErr } = await sb
          .from("listing_images")
          .update({ sort_order: i })
          .eq("id", s.rowId);
        if (sortErr) {
          setSubmitting(false);
          setError(`Fotoğraf sırası güncellenemedi: ${sortErr.message}`);
          return;
        }
      } else {
        const ext = fileExtension(s.file);
        const storagePath = `${user.id}/${listing.id}/e-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { error: upPhotoErr } = await sb.storage
          .from("listing-images")
          .upload(storagePath, s.file, {
            contentType: uploadContentType(s.file),
            upsert: false
          });
        if (upPhotoErr) {
          setSubmitting(false);
          setError(`Yeni fotoğraf yüklenemedi: ${upPhotoErr.message}`);
          return;
        }
        const {
          data: { publicUrl }
        } = sb.storage.from("listing-images").getPublicUrl(storagePath);
        const { error: insImgErr } = await sb.from("listing_images").insert({
          listing_id: listing.id,
          image_url: publicUrl,
          sort_order: i
        });
        if (insImgErr) {
          setSubmitting(false);
          setError(`Görsel kaydı başarısız: ${insImgErr.message}`);
          return;
        }
      }
    }

    const refreshed = await fetchListingForEdit(sb, listingId);
    if (refreshed && refreshed.sellerId === user.id) {
      setListing(refreshed);
    }

    setSubmitting(false);
    setNotice("İlanın güncellendi.");
    setEditPriceText(formatPriceInputDisplay(price));
    setRemovedExisting([]);
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

  const districtChoices = (() => {
    const fromData = getDistrictsForProvince(editCity);
    if (editDistrict && !fromData.includes(editDistrict)) {
      return [editDistrict, ...fromData];
    }
    return fromData;
  })();

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
              <label htmlFor="edit-price">Fiyat (TL)</label>
              <input
                id="edit-price"
                required
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={editPriceText}
                onChange={(e) => setEditPriceText(e.target.value)}
                onBlur={() => {
                  const n = parsePriceInput(editPriceText);
                  if (Number.isFinite(n) && n >= 0) {
                    setEditPriceText(formatPriceInputDisplay(n));
                  }
                }}
                placeholder="Örn: 875 veya 1.500 veya 750.000"
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
                required
                value={editCity}
                disabled={submitting}
                onChange={(e) => {
                  setEditCity(e.target.value);
                  setEditDistrict("");
                }}
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
              <label htmlFor="edit-district">İlçe</label>
              <select
                id="edit-district"
                disabled={!editCity || submitting}
                value={editDistrict}
                onChange={(e) => setEditDistrict(e.target.value)}
              >
                <option value="">İsteğe bağlı</option>
                {editCity
                  ? districtChoices.map((ilce) => (
                      <option key={ilce} value={ilce}>
                        {ilce}
                      </option>
                    ))
                  : null}
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
            <label htmlFor="edit-gallery-photos">
              Fotoğraflar{" "}
              <span className="meta" style={{ fontWeight: 400 }}>
                (en az 1, en fazla {MAX_LISTING_PHOTOS})
              </span>
            </label>
            <input
              id="edit-gallery-photos"
              type="file"
              accept="image/*"
              multiple
              disabled={submitting || galleryNormalizing}
              onChange={(e) => void handleGalleryPhotosChange(e)}
            />
            <p className="meta" style={{ marginTop: 6 }}>
              {galleryNormalizing
                ? "Fotoğraflar hazırlanıyor…"
                : "Galeriyi yatay kaydırın; × ile silin, ◀ ▶ ile sırayı değiştirin. İlk fotoğraf kapak olur."}{" "}
              {slides.length > 0 && (
                <>
                  Şu an: {slides.length}/{MAX_LISTING_PHOTOS}
                </>
              )}
            </p>
            {slides.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: 6,
                  marginTop: 10,
                  maxWidth: "100%"
                }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={
                      slide.kind === "existing"
                        ? slide.rowId
                        : slide.previewUrl
                    }
                    style={{
                      position: "relative",
                      flex: "0 0 min(42vw, 140px)",
                      scrollSnapAlign: "start",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      aspectRatio: "1"
                    }}
                  >
                    {slide.kind === "existing" ? (
                      <Image
                        src={slide.url}
                        alt={`İlan ${index + 1}`}
                        width={280}
                        height={280}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- blob önizleme
                      <img
                        src={slide.previewUrl}
                        alt={`Yeni fotoğraf ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        right: 4,
                        display: "flex",
                        gap: 4,
                        justifyContent: "center"
                      }}
                    >
                      <button
                        type="button"
                        disabled={
                          submitting ||
                          galleryNormalizing ||
                          index <= 0
                        }
                        onClick={() => moveSlide(index, -1)}
                        style={{
                          padding: "2px 6px",
                          fontSize: 12,
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(0,0,0,0.65)",
                          color: "#fff",
                          cursor:
                            submitting || galleryNormalizing || index <= 0
                              ? "default"
                              : "pointer"
                        }}
                        aria-label="Sola taşı"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={
                          submitting ||
                          galleryNormalizing ||
                          index >= slides.length - 1
                        }
                        onClick={() => moveSlide(index, 1)}
                        style={{
                          padding: "2px 6px",
                          fontSize: 12,
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(0,0,0,0.65)",
                          color: "#fff",
                          cursor:
                            submitting ||
                            galleryNormalizing ||
                            index >= slides.length - 1
                              ? "default"
                              : "pointer"
                        }}
                        aria-label="Sağa taşı"
                      >
                        ▶
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || galleryNormalizing}
                      onClick={() => removeSlideAt(index)}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        cursor: submitting ? "default" : "pointer",
                        fontSize: 16,
                        lineHeight: 1
                      }}
                      aria-label="Bu fotoğrafı kaldır"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span
                        className="meta"
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff"
                        }}
                      >
                        Kapak
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            disabled={submitting || galleryNormalizing}
          >
            {submitting
              ? "Kaydediliyor…"
              : galleryNormalizing
                ? "Fotoğraflar hazırlanıyor…"
                : "Değişiklikleri kaydet"}
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
