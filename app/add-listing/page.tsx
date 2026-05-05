"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  formatPriceInputDisplay,
  isIntermediateGayrimenkulListingKey,
  getTasitlarOtomobilBrandSlugAwaitingModel,
  isIntermediateTasitlarOtomobilListingKey,
  parsePriceInput,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import CategoryMillerPicker from "@/components/CategoryMillerPicker";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getDistrictsForProvince } from "@/lib/turkish-districts";
import {
  TURKEY_PROVINCE_COUNT,
  TURKEY_PROVINCES
} from "@/lib/turkish-provinces";
import { isUniqueViolation, randomListingCode } from "@/lib/listing-code";
import {
  listingExpiresAtIsoFromNow,
  MAX_LISTINGS_PER_USER
} from "@/lib/listing-policy";
import { MAX_LISTING_PHOTOS } from "@/lib/listing-photos";
import { countSellerOpenListings } from "@/lib/listings-data";
import {
  LISTING_IMAGE_MAX_EDGE_PX,
  resizeListingImageForUpload
} from "@/lib/resize-listing-image";

function mapListingInsertError(message: string | undefined): string {
  if (!message) return "İlan kaydedilemedi.";
  const lower = message.toLowerCase();
  if (
    lower.includes("expires_at") ||
    lower.includes("expires at")
  ) {
    return "Veritabanında ilan süresi sütunu eksik. Supabase → SQL Editor’da sql/migration_listing_expires_quota.sql dosyasını çalıştırın.";
  }
  if (
    lower.includes("listing_code") ||
    (lower.includes("listing code") && lower.includes("column"))
  ) {
    return "Veritabanında ilan numarası sütunu eksik. Supabase → SQL Editor’da sql/migration_listing_code.sql dosyasını çalıştırın.";
  }
  if (message.includes("row-level security")) {
    return "İlan kaydedilemedi. Oturumunuzu kontrol edin.";
  }
  return message;
}

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

/** Bazı tarayıcılar JPEG’i application/octet-stream veya boş MIME ile verir; yalnızca image/* filtrelemek fotoğrafları eler. */
const IMAGE_NAME_PATTERN =
  /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tif|tiff)$/i;

function isLikelyImageFile(f: File): boolean {
  const mime = (f.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return IMAGE_NAME_PATTERN.test(f.name);
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
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
    bmp: "image/bmp",
    tif: "image/tiff",
    tiff: "image/tiff"
  };
  return map[ext] ?? "image/jpeg";
}

type PhotoPick = { file: File; url: string };

export default function AddListingPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoPick[]>([]);
  const photosRef = useRef<PhotoPick[]>([]);
  photosRef.current = photos;
  const [groupSlug, setGroupSlug] = useState("");
  const [detailCategoryKey, setDetailCategoryKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [categoryRowCount, setCategoryRowCount] = useState<number | null>(null);
  const [listingCity, setListingCity] = useState("");
  const [listingDistrict, setListingDistrict] = useState("");
  const [priceText, setPriceText] = useState("");
  const [photosNormalizing, setPhotosNormalizing] = useState(false);

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
    if (!hasSupabaseConfig || !user) {
      setCategoryRowCount(null);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void sb
      .from("categories")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) {
          setCategoryRowCount(null);
          return;
        }
        setCategoryRowCount(count ?? 0);
      });
  }, [user]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const handlePhotosChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Array.from(event.target.files ?? []);
    const incoming = raw.filter(isLikelyImageFile);
    if (incoming.length === 0) {
      if (raw.length > 0) {
        setError(
          "Seçilen dosyalar görsel olarak tanınmadı. JPG, PNG veya WEBP deneyin."
        );
      }
      event.target.value = "";
      return;
    }
    setError("");
    setPhotosNormalizing(true);
    try {
      const resized = await Promise.all(
        incoming.map((f) => resizeListingImageForUpload(f))
      );
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        const merged = [...prev.map((p) => p.file), ...resized].slice(
          0,
          MAX_LISTING_PHOTOS
        );
        return merged.map((file) => ({
          file,
          url: URL.createObjectURL(file)
        }));
      });
    } finally {
      setPhotosNormalizing(false);
      event.target.value = "";
    }
  };

  function removePhotoAt(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function movePhoto(fromIndex: number, delta: -1 | 1) {
    const toIndex = fromIndex + delta;
    setPhotos((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb || !user) {
      setError("Oturum gerekli. Lütfen giriş yapın.");
      return;
    }
    if (!detailCategoryKey) {
      setError("Ana ve alt kategori seçin.");
      return;
    }
    if (isIntermediateGayrimenkulListingKey(detailCategoryKey)) {
      setError(
        "Emlak kategorisinde Satılık veya Kiralık seçimini tamamlayın (Konut ise ayrıca konut tipi gerekir)."
      );
      return;
    }
    if (isIntermediateTasitlarOtomobilListingKey(detailCategoryKey)) {
      setError(
        getTasitlarOtomobilBrandSlugAwaitingModel(detailCategoryKey)
          ? "Otomobil için listeden bir model seçin."
          : "Otomobil için listeden bir marka seçin."
      );
      return;
    }

    const fd = new FormData(event.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const city = listingCity.trim();
    const districtTrim = listingDistrict.trim();
    const price = parsePriceInput(priceText);

    if (!title || !description || !city) {
      setError("Başlık, açıklama ve şehir zorunludur.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    if (photos.length === 0) {
      setError("En az bir fotoğraf seçin (en fazla 8).");
      return;
    }

    const openCount = await countSellerOpenListings(sb, user.id);
    if (openCount >= MAX_LISTINGS_PER_USER) {
      setError(
        `En fazla ${MAX_LISTINGS_PER_USER} onay bekleyen veya yayındaki ilanınız olabilir. Bir ilanı satıldı işaretleyin, süresi bitsin veya silin; sonra yeni ilan verebilirsiniz.`
      );
      return;
    }

    const sqlSlug = sqlCategorySlugFromKey(detailCategoryKey);
    setSubmitting(true);

    const { data: catRow, error: catErr } = await sb
      .from("categories")
      .select("id")
      .eq("slug", sqlSlug)
      .maybeSingle();

    if (catErr) {
      setSubmitting(false);
      setError(
        `Kategori sorgusu başarısız: ${catErr.message}. Tablo izinlerini (RLS) kontrol edin.`
      );
      return;
    }
    if (!catRow?.id) {
      setSubmitting(false);
      setError(
        "Seçilen kategori veritabanında yok. Supabase → SQL Editor’da `sql/seed_categories.sql` dosyasındaki INSERT’i çalıştırın (veya `schema.sql` içindeki kategori INSERT bloğu). Bir kez yeterli."
      );
      return;
    }

    let inserted: { id: string } | null = null;
    let insErr: { message?: string; code?: string } | null = null;

    for (let attempt = 0; attempt < 25; attempt++) {
      const listing_code = randomListingCode();
      const res = await sb
        .from("listings")
        .insert({
          seller_id: user.id,
          category_id: catRow.id,
          title,
          description,
          price,
          city,
          district: districtTrim || null,
          condition: "used",
          show_phone_on_listing: false,
          expires_at: listingExpiresAtIsoFromNow(),
          listing_code
        })
        .select("id")
        .single();

      if (!res.error && res.data?.id) {
        inserted = res.data as { id: string };
        insErr = null;
        break;
      }
      if (res.error && isUniqueViolation(res.error)) {
        continue;
      }
      insErr = res.error;
      break;
    }

    if (insErr || !inserted?.id) {
      setSubmitting(false);
      setError(mapListingInsertError(insErr?.message));
      return;
    }

    const listingId = inserted.id as string;
    const uploadedPaths: string[] = [];
    const imageRows: {
      listing_id: string;
      image_url: string;
      sort_order: number;
    }[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i].file;
      const ext = fileExtension(file);
      const storagePath = `${user.id}/${listingId}/${i}.${ext}`;

      const { error: upErr } = await sb.storage
        .from("listing-images")
        .upload(storagePath, file, {
          contentType: uploadContentType(file),
          upsert: false
        });

      if (upErr) {
        if (uploadedPaths.length) {
          await sb.storage.from("listing-images").remove(uploadedPaths);
        }
        await sb.from("listings").delete().eq("id", listingId);
        setSubmitting(false);
        setError(
          `Fotoğraf yüklenemedi (${i + 1}. dosya): ${upErr.message}. Depolama izni veya kotayı kontrol edin.`
        );
        return;
      }

      uploadedPaths.push(storagePath);
      const {
        data: { publicUrl }
      } = sb.storage.from("listing-images").getPublicUrl(storagePath);
      imageRows.push({
        listing_id: listingId,
        image_url: publicUrl,
        sort_order: i
      });
    }

    let imgErr: { message: string } | null = null;
    for (const row of imageRows) {
      const { error: rowErr } = await sb.from("listing_images").insert(row);
      if (rowErr) {
        imgErr = rowErr;
        break;
      }
    }

    if (imgErr) {
      await sb.storage.from("listing-images").remove(uploadedPaths);
      await sb.from("listings").delete().eq("id", listingId);
      setSubmitting(false);
      setError(
        `Görsel kaydı başarısız: ${imgErr.message}. Oturum ve veritabanı (listing_images) izinlerini kontrol edin.`
      );
      return;
    }

    setSubmitting(false);
    setNotice(
      `İlanınız alındı (${photos.length} fotoğraf). Moderasyon sonrası yayınlanacak; onaylanınca herkes görebilir.`
    );
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setGroupSlug("");
    setDetailCategoryKey("");
    setListingCity("");
    setListingDistrict("");
    setPriceText("");
    event.currentTarget.reset();
  };

  if (!authReady) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (hasSupabaseConfig && !user) {
    return (
      <main className="container">
        <h1 className="section-title">İlan ver</h1>
        <section className="panel auth-wall">
          <p>
            İlan verebilmek için üye olmalı ve giriş yapmalısın. Böylece güvenli
            bir ilan platformu tutabiliriz.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/login?next=/add-listing">
              Giriş yap
            </Link>
            <Link className="btn btn-outline" href="/register">
              Üye ol
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="section-title">İlan ver</h1>
      {hasSupabaseConfig && (
        <p className="meta" style={{ marginBottom: 14, maxWidth: 640 }}>
          Aynı anda en fazla <strong>{MAX_LISTINGS_PER_USER}</strong> onay
          bekleyen veya yayındaki ilan verebilirsiniz. Yayındaki her ilan en
          çok <strong>30 gün</strong> listelenir; süre sonunda ilan
          (fotoğraflarıyla) kaldırılır. Alıcıyla anlaştıysanız profil veya
          «İlanlarım» üzerinden <strong>Satıldı</strong> diyerek vitrinden
          erken çekebilirsiniz.
        </p>
      )}
      {hasSupabaseConfig && categoryRowCount === 0 && (
        <p className="notice" style={{ marginBottom: 14 }}>
          Veritabanında kategori kaydı yok. Supabase → SQL Editor&apos;da
          depodaki{" "}
          <code style={{ fontSize: 13 }}>sql/seed_categories.sql</code> içeriğini
          yapıştırıp çalıştırın (veya{" "}
          <code style={{ fontSize: 13 }}>schema.sql</code>
          &nbsp;içindeki kategori <code style={{ fontSize: 13 }}>INSERT</code>{" "}
          bloğu). Sonra bu sayfayı yenileyin.
        </p>
      )}
      <section className="panel">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div>
              <label htmlFor="listing-title">Başlık</label>
              <input
                id="listing-title"
                name="title"
                required
                type="text"
                placeholder="Örn: iPhone 14 256 GB"
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="listing-price">Fiyat (TL)</label>
              <input
                id="listing-price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                onBlur={() => {
                  const n = parsePriceInput(priceText);
                  if (Number.isFinite(n) && n >= 0) {
                    setPriceText(formatPriceInputDisplay(n));
                  }
                }}
                placeholder="Örn: 875 veya 1.500 veya 250.000"
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <CategoryMillerPicker
              groupSlug={groupSlug}
              detailCategoryKey={detailCategoryKey}
              disabled={submitting}
              onGroupChange={setGroupSlug}
              onCategoryKeyChange={setDetailCategoryKey}
            />
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label htmlFor="listing-city">
                Şehir{" "}
                <span className="meta" style={{ fontWeight: 400 }}>
                  ({TURKEY_PROVINCE_COUNT} il)
                </span>
              </label>
              <select
                id="listing-city"
                required
                disabled={submitting}
                value={listingCity}
                onChange={(e) => {
                  setListingCity(e.target.value);
                  setListingDistrict("");
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
              <label htmlFor="listing-district">İlçe</label>
              <select
                id="listing-district"
                disabled={!listingCity || submitting}
                value={listingDistrict}
                onChange={(e) => setListingDistrict(e.target.value)}
              >
                <option value="">İsteğe bağlı</option>
                {listingCity
                  ? getDistrictsForProvince(listingCity).map((ilce) => (
                      <option key={ilce} value={ilce}>
                        {ilce}
                      </option>
                    ))
                  : null}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="listing-desc">Açıklama</label>
            <textarea
              id="listing-desc"
              name="description"
              required
              rows={6}
              placeholder="Ürünü detaylı açıklayın"
              disabled={submitting}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="listing-photo">
              Fotoğraflar{" "}
              <span className="meta" style={{ fontWeight: 400 }}>
                (en az 1, en fazla {MAX_LISTING_PHOTOS})
              </span>
            </label>
            <input
              id="listing-photo"
              type="file"
              accept="image/*"
              multiple
              disabled={
                submitting ||
                photosNormalizing ||
                photos.length >= MAX_LISTING_PHOTOS
              }
              onChange={handlePhotosChange}
            />
            <p className="meta" style={{ marginTop: 6 }}>
              {photosNormalizing
                ? "Fotoğraflar standart boyuta getiriliyor…"
                : `Büyük görseller en fazla ${LISTING_IMAGE_MAX_EDGE_PX} px uzun kenara indirilir ve JPEG olarak kaydedilir.`}{" "}
              Birden fazla seçebilir veya tekrar ekleyerek tamamlayabilirsiniz.
              {photos.length > 0 && (
                <>
                  {" "}
                  Şu an: {photos.length}/{MAX_LISTING_PHOTOS}
                </>
              )}
            </p>
            {photos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="meta" style={{ marginBottom: 8 }}>
                  Fotoğrafları yatay kaydırarak görebilir; sırayı «Sol / Sağ» ile,
                  silmek için × kullanın. İlk sıradaki görsel ilanda kapak olur.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: 6,
                    maxWidth: "100%"
                  }}
                >
                  {photos.map((p, index) => (
                    <div
                      key={p.url}
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
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={p.url}
                        alt={`Önizleme ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
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
                            submitting || photosNormalizing || index <= 0
                          }
                          onClick={() => movePhoto(index, -1)}
                          style={{
                            padding: "2px 6px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "none",
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            cursor:
                              submitting || photosNormalizing || index <= 0
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
                            photosNormalizing ||
                            index >= photos.length - 1
                          }
                          onClick={() => movePhoto(index, 1)}
                          style={{
                            padding: "2px 6px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "none",
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            cursor:
                              submitting ||
                              photosNormalizing ||
                              index >= photos.length - 1
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
                        disabled={submitting || photosNormalizing}
                        onClick={() => removePhotoAt(index)}
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
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            type="submit"
            disabled={submitting || photosNormalizing}
          >
            {submitting
              ? "Gönderiliyor…"
              : photosNormalizing
                ? "Fotoğraflar hazırlanıyor…"
                : "İlanı Gönder"}
          </button>
          {error && (
            <p className="notice" style={{ marginTop: 10, background: "#fee2e2", borderColor: "#fecaca", color: "#7f1d1d" }}>
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
