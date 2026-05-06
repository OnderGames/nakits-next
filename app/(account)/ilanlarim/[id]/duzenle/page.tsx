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
  formatCategoryDisplay,
  formatPriceInputDisplay,
  getTasitlarOtomobilBrandSlugAwaitingModel,
  isIntermediateGayrimenkulListingKey,
  isIntermediateTasitlarOtomobilListingKey,
  isOtomobilSeriesLeafAwaitingBodyVariant,
  isReadyListingCategoryKey,
  parseCategoryKey,
  parsePriceInput,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import { isTasitlarListingCategoryKey } from "@/lib/listing-detail-spec";
import { parseModelYearInput } from "@/lib/vehicle-fields";
import { useLiveTrPriceInput } from "@/lib/use-live-tr-price-input";
import AddListingMainCategoryGrid from "@/components/AddListingMainCategoryGrid";
import CategoryMillerPicker from "@/components/CategoryMillerPicker";
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
import { formatListingExpiryShort } from "@/lib/listing-policy";
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

type EditListingPhase = "main" | "sub" | "details";

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
  const [editVehicleModelYearStr, setEditVehicleModelYearStr] = useState("");
  const [editVehicleKmText, setEditVehicleKmText] = useState("");
  const livePriceInput = useLiveTrPriceInput(editPriceText, setEditPriceText);
  const liveKmEditInput = useLiveTrPriceInput(
    editVehicleKmText,
    setEditVehicleKmText
  );
  const [phase, setPhase] = useState<EditListingPhase>("main");
  const skipSubAutoAdvanceRef = useRef(false);
  const prevCategoryReadyRef = useRef(false);

  useEffect(() => {
    if (phase !== "sub") {
      prevCategoryReadyRef.current =
        isReadyListingCategoryKey(detailCategoryKey);
      return;
    }
    const ready = isReadyListingCategoryKey(detailCategoryKey);
    if (skipSubAutoAdvanceRef.current) {
      skipSubAutoAdvanceRef.current = false;
      prevCategoryReadyRef.current = ready;
      return;
    }
    if (ready && !prevCategoryReadyRef.current) {
      setPhase("details");
    }
    prevCategoryReadyRef.current = ready;
  }, [phase, detailCategoryKey]);

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
      const keyTrim = (row.categoryKey ?? "").trim();
      if (!keyTrim || !parseCategoryKey(keyTrim)) {
        setPhase("main");
        prevCategoryReadyRef.current = false;
      } else {
        const leafOk = isReadyListingCategoryKey(keyTrim);
        prevCategoryReadyRef.current = leafOk;
        setPhase(leafOk ? "details" : "sub");
      }
      setCondition(row.condition);
      setEditCity(row.city);
      setEditDistrict(row.district ?? "");
      setEditPriceText(formatPriceInputDisplay(row.price));
      setEditVehicleModelYearStr(
        row.modelYear != null && Number.isFinite(row.modelYear)
          ? String(Math.round(row.modelYear))
          : ""
      );
      setEditVehicleKmText(
        row.vehicleKm != null && Number.isFinite(row.vehicleKm)
          ? formatPriceInputDisplay(Math.round(row.vehicleKm))
          : ""
      );
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
    if (isIntermediateGayrimenkulListingKey(detailCategoryKey)) {
      setError(
        "Emlak kategorisinde Satılık veya Kiralık seçimini tamamlayın (Konut ise ayrıca konut tipi gerekir)."
      );
      return;
    }
    if (isIntermediateTasitlarOtomobilListingKey(detailCategoryKey)) {
      const awaiting =
        getTasitlarOtomobilBrandSlugAwaitingModel(detailCategoryKey);
      setError(
        awaiting === "bmw"
          ? "BMW için sırayla seri ve gövde modelini seçin."
          : awaiting
            ? "Otomobil için listeden bir model seçin."
            : "Otomobil için listeden bir marka seçin."
      );
      return;
    }
    if (isOtomobilSeriesLeafAwaitingBodyVariant(detailCategoryKey)) {
      setError(
        "BMW için önce seriyi, ardından gövde modelini seçin (örn. 1 Serisi › 116d)."
      );
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

    const vasita = isTasitlarListingCategoryKey(detailCategoryKey);
    let modelYearVal: number | null = null;
    let vehicleKmVal: number | null = null;
    if (vasita) {
      const ys = editVehicleModelYearStr.trim();
      if (!ys) {
        setError("Vasıta ilanlarında model yılı zorunludur.");
        return;
      }
      const y = parseModelYearInput(ys);
      if (y == null) {
        setError("Model yılı 1950–2050 arasında bir tam sayı olmalı.");
        return;
      }
      modelYearVal = y;

      if (!editVehicleKmText.trim()) {
        setError("Vasıta ilanlarında kilometre zorunludur.");
        return;
      }
      const km = Math.round(parsePriceInput(editVehicleKmText));
      if (!Number.isFinite(km) || km < 0 || km > 9999999) {
        setError("Kilometre geçerli bir tam sayı olmalı (örn. 120.000).");
        return;
      }
      vehicleKmVal = km;
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
        show_phone_on_listing: false,
        category_id: catRow.id,
        model_year: vasita ? modelYearVal : null,
        vehicle_km: vasita ? vehicleKmVal : null
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
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan düzenle</h1>
        <p className="notice">Supabase yapılandırması yok.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-page">
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
      </div>
    );
  }

  if (user && !listingFetchDone) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan düzenle</h1>
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (listing === null) {
    return (
      <div className="account-page">
        <h1 className="section-title">İlan düzenle</h1>
        <section className="panel">
          <p>Bu ilan yok veya bu ilanı düzenleme yetkiniz bulunmuyor.</p>
          <Link href="/ilanlarim">İlanlarıma dön</Link>
        </section>
      </div>
    );
  }

  const districtChoices = (() => {
    const fromData = getDistrictsForProvince(editCity);
    if (editDistrict && !fromData.includes(editDistrict)) {
      return [editDistrict, ...fromData];
    }
    return fromData;
  })();

  const expiryShort =
    (listing.status === "pending" || listing.status === "active") &&
    listing.expiresAt
      ? formatListingExpiryShort(listing.expiresAt)
      : null;

  function goBackToMainCategory() {
    setGroupSlug("");
    setDetailCategoryKey("");
    setPhase("main");
    prevCategoryReadyRef.current = false;
  }

  function goEditCategoryFromDetails() {
    skipSubAutoAdvanceRef.current = true;
    setPhase("sub");
  }

  return (
    <div className="account-page add-listing-flow">
      <h1 className="section-title">İlan düzenle</h1>
      {listing.listingCode && listing.listingCode !== "—" && (
        <p className="meta" style={{ marginBottom: 10 }}>
          İlan numarası: <strong>{listing.listingCode}</strong>
          {" · "}
          <Link
            href={`/listings/${listing.listingCode}`}
            style={{ color: "var(--primary)" }}
          >
            Bu numara ile açılan ilan sayfası
          </Link>
        </p>
      )}
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
            {expiryShort && (
              <>
                {" "}
                · {expiryShort}
              </>
            )}
          </>
        )}
      </p>

      <nav className="add-listing-steps" aria-label="İlan düzenleme adımları">
        <span
          className={
            phase === "main"
              ? "add-listing-steps__item add-listing-steps__item--active"
              : "add-listing-steps__item add-listing-steps__item--done"
          }
        >
          <span className="add-listing-steps__num">1</span>
          Ana kategori
        </span>
        <span className="add-listing-steps__sep" aria-hidden>
          →
        </span>
        <span
          className={
            phase === "sub"
              ? "add-listing-steps__item add-listing-steps__item--active"
              : phase === "details"
                ? "add-listing-steps__item add-listing-steps__item--done"
                : "add-listing-steps__item"
          }
        >
          <span className="add-listing-steps__num">2</span>
          Alt tür
        </span>
        <span className="add-listing-steps__sep" aria-hidden>
          →
        </span>
        <span
          className={
            phase === "details"
              ? "add-listing-steps__item add-listing-steps__item--active"
              : "add-listing-steps__item"
          }
        >
          <span className="add-listing-steps__num">3</span>
          Bilgiler ve fotoğraf
        </span>
      </nav>

      {phase === "main" && (
        <section className="panel">
          <AddListingMainCategoryGrid
            disabled={submitting}
            onSelectMain={(slug) => {
              setGroupSlug(slug);
              setDetailCategoryKey("");
              setPhase("sub");
              prevCategoryReadyRef.current = false;
            }}
          />
        </section>
      )}

      {phase === "sub" && (
        <section className="panel">
          <CategoryMillerPicker
            groupSlug={groupSlug}
            detailCategoryKey={detailCategoryKey}
            disabled={submitting}
            hideMainGroupColumn
            onRequestChangeMainCategory={goBackToMainCategory}
            onGroupChange={setGroupSlug}
            onCategoryKeyChange={setDetailCategoryKey}
          />
        </section>
      )}

      {phase === "details" && (
      <section className="panel">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="add-listing-cat-chip" style={{ marginBottom: 14 }}>
            <p className="add-listing-cat-chip__text">
              {detailCategoryKey
                ? formatCategoryDisplay(detailCategoryKey)
                : "Kategori seçilmedi"}
            </p>
            <button
              type="button"
              className="add-listing-cat-chip__btn"
              disabled={submitting}
              onClick={goEditCategoryFromDetails}
            >
              Kategoriyi düzenle
            </button>
          </div>

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
                ref={livePriceInput.inputRef}
                id="edit-price"
                required
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={editPriceText}
                onChange={livePriceInput.onChange}
                onBlur={livePriceInput.onBlur}
                placeholder="Örn: 875 veya 1.500 veya 750.000"
                disabled={submitting}
              />
              <p className="meta" style={{ marginTop: 6 }}>
                Aynı fiyatı{" "}
                <Link href="/ilanlarim" style={{ textDecoration: "underline" }}>
                  İlanlarım
                </Link>{" "}
                listesindeki «Fiyatı kaydet» ile de güncelleyebilirsiniz.
              </p>
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

          {isTasitlarListingCategoryKey(detailCategoryKey) ? (
            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <label htmlFor="edit-model-year">Model yılı (zorunlu)</label>
                <input
                  id="edit-model-year"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2050}
                  step={1}
                  required
                  placeholder="Örn: 2018"
                  value={editVehicleModelYearStr}
                  onChange={(e) => setEditVehicleModelYearStr(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-km">Kilometre (zorunlu)</label>
                <input
                  ref={liveKmEditInput.inputRef}
                  id="edit-km"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="Örn: 120.000"
                  value={editVehicleKmText}
                  onChange={liveKmEditInput.onChange}
                  onBlur={liveKmEditInput.onBlur}
                  disabled={submitting}
                />
              </div>
            </div>
          ) : null}

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
      )}
    </div>
  );
}
