"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  formatCategoryDisplay,
  isIntermediateGayrimenkulListingKey,
  getTasitlarOtomobilBrandSlugAwaitingModel,
  isIntermediateTasitlarOtomobilListingKey,
  isOtomobilSeriesLeafAwaitingBodyVariant,
  isReadyListingCategoryKey,
  parsePriceInput,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import { useLiveTrPriceInput } from "@/lib/use-live-tr-price-input";
import AddListingMainCategoryGrid from "@/components/AddListingMainCategoryGrid";
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
  listingExpiresAtIsoFromDays,
  MAX_LISTINGS_PER_USER
} from "@/lib/listing-policy";
import {
  fetchListingDurationDaysPublic,
  LISTING_DURATION_DEFAULT_DAYS
} from "@/lib/site-settings";
import { isTasitlarListingCategoryKey } from "@/lib/listing-detail-spec";
import { parseModelYearInput } from "@/lib/vehicle-fields";
import { MAX_LISTING_PHOTOS } from "@/lib/listing-photos";
import { countSellerOpenListings } from "@/lib/listings-data";
import { resizeListingImageForUpload } from "@/lib/resize-listing-image";

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
    lower.includes("model_year") ||
    lower.includes("vehicle_km")
  ) {
    return "Veritabanında vasıta alanları eksik. Supabase → SQL Editor’da sql/migration_listings_vehicle_year_km.sql dosyasını çalıştırın.";
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

type AddListingPhase = "main" | "sub" | "details";

export default function AddListingPage() {
  const router = useRouter();
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    photoCount: number;
  } | null>(null);
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
  const [listingDurationDays, setListingDurationDays] = useState(
    LISTING_DURATION_DEFAULT_DAYS
  );
  const [vehicleModelYearStr, setVehicleModelYearStr] = useState("");
  const [vehicleKmText, setVehicleKmText] = useState("");
  const livePriceInput = useLiveTrPriceInput(priceText, setPriceText);
  const liveKmInput = useLiveTrPriceInput(vehicleKmText, setVehicleKmText);
  const [photosNormalizing, setPhotosNormalizing] = useState(false);
  const [phase, setPhase] = useState<AddListingPhase>("main");
  const skipSubAutoAdvanceRef = useRef(false);
  const prevCategoryReadyRef = useRef(false);
  const galleryPhotoInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "sub") {
      prevCategoryReadyRef.current = isReadyListingCategoryKey(detailCategoryKey);
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
    if (!submissionSuccess) {
      return undefined;
    }
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      setSubmissionSuccess(null);
      router.push("/");
      router.refresh();
    }, 2800);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [submissionSuccess, router]);

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
    if (!hasSupabaseConfig) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void fetchListingDurationDaysPublic(sb).then(setListingDurationDays);
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

    const vasita = isTasitlarListingCategoryKey(detailCategoryKey);
    let modelYearIns: number | null = null;
    let vehicleKmIns: number | null = null;
    if (vasita) {
      const ys = vehicleModelYearStr.trim();
      if (!ys) {
        setError("Vasıta ilanlarında model yılı zorunludur.");
        return;
      }
      const y = parseModelYearInput(ys);
      if (y == null) {
        setError("Model yılı 1950–2050 arasında bir tam sayı olmalı.");
        return;
      }
      modelYearIns = y;

      if (!vehicleKmText.trim()) {
        setError("Vasıta ilanlarında kilometre zorunludur.");
        return;
      }
      const km = Math.round(parsePriceInput(vehicleKmText));
      if (!Number.isFinite(km) || km < 0 || km > 9999999) {
        setError("Kilometre geçerli bir tam sayı olmalı (örn. 120.000).");
        return;
      }
      vehicleKmIns = km;
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
          expires_at: listingExpiresAtIsoFromDays(listingDurationDays),
          listing_code,
          model_year: vasita ? modelYearIns : null,
          vehicle_km: vasita ? vehicleKmIns : null
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
    setSubmissionSuccess({ photoCount: photos.length });
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setGroupSlug("");
    setDetailCategoryKey("");
    setPhase("main");
    prevCategoryReadyRef.current = false;
    setListingCity("");
    setListingDistrict("");
    setPriceText("");
    setVehicleModelYearStr("");
    setVehicleKmText("");
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
            İlan verebilmek için üye olmalı ve giriş yapmalısın.
          </p>
          <div className="auth-wall__actions">
            <Link className="nav-pill nav-pill--login" href="/login?next=/add-listing">
              Giriş yap
            </Link>
            <Link className="nav-pill nav-pill--join" href="/register">
              Üye ol
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
    <main className="container add-listing-flow">
      <h1 className="section-title">İlan ver</h1>
      {hasSupabaseConfig && (
        <p className="meta" style={{ marginBottom: 0, maxWidth: 640 }}>
          Aynı anda en fazla <strong>{MAX_LISTINGS_PER_USER}</strong> onay
          bekleyen veya yayındaki ilan verebilirsiniz. Yayındaki her ilan en
          çok <strong>30 gün</strong> listelenir; süre sonunda ilan
          (fotoğraflarıyla) kaldırılır. Alıcıyla anlaştıysanız profil veya
          «İlanlarım» üzerinden <strong>Satıldı</strong> diyerek vitrinden
          erken çekebilirsiniz.
        </p>
      )}
      {hasSupabaseConfig && categoryRowCount === 0 && (
        <p className="notice" style={{ marginBottom: 0 }}>
          Veritabanında kategori kaydı yok. Supabase → SQL Editor&apos;da
          depodaki{" "}
          <code style={{ fontSize: 13 }}>sql/seed_categories.sql</code> içeriğini
          yapıştırıp çalıştırın (veya{" "}
          <code style={{ fontSize: 13 }}>schema.sql</code>
          &nbsp;içindeki kategori <code style={{ fontSize: 13 }}>INSERT</code>{" "}
          bloğu). Sonra bu sayfayı yenileyin.
        </p>
      )}

      <nav className="add-listing-steps" aria-label="İlan verme adımları">
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
        <form onSubmit={handleSubmit}>
          <div className="add-listing-cat-chip" style={{ marginBottom: 14 }}>
            <p className="add-listing-cat-chip__text">
              {formatCategoryDisplay(detailCategoryKey)}
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
                ref={livePriceInput.inputRef}
                id="listing-price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={priceText}
                onChange={livePriceInput.onChange}
                onBlur={livePriceInput.onBlur}
                placeholder="Örn: 875 veya 1.500 veya 250.000"
                disabled={submitting}
              />
            </div>
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

          {isTasitlarListingCategoryKey(detailCategoryKey) ? (
            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <label htmlFor="listing-model-year">Model yılı (zorunlu)</label>
                <input
                  id="listing-model-year"
                  name="vehicle_model_year"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2050}
                  step={1}
                  required
                  placeholder="Örn: 2018"
                  value={vehicleModelYearStr}
                  onChange={(e) => setVehicleModelYearStr(e.target.value)}
                  disabled={submitting}
                />
                <p className="meta" style={{ marginTop: 6, marginBottom: 0 }}>
                  1950–2050 arası; ilan özetinde gösterilir.
                </p>
              </div>
              <div>
                <label htmlFor="listing-km">Kilometre (zorunlu)</label>
                <input
                  ref={liveKmInput.inputRef}
                  id="listing-km"
                  name="vehicle_km"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="Örn: 120.000"
                  value={vehicleKmText}
                  onChange={liveKmInput.onChange}
                  onBlur={liveKmInput.onBlur}
                  disabled={submitting}
                />
                <p className="meta" style={{ marginTop: 6, marginBottom: 0 }}>
                  Tam sayı km; binlik ayırıcı kullanabilirsiniz.
                </p>
              </div>
            </div>
          ) : null}

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
            <p
              id="listing-photo-label"
              style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}
            >
              Fotoğraflar{" "}
              <span className="meta" style={{ fontWeight: 400 }}>
                (en az 1, en fazla {MAX_LISTING_PHOTOS})
              </span>
            </p>
            <div
              className="add-listing-photo-picker"
              role="group"
              aria-labelledby="listing-photo-label"
            >
              <input
                ref={galleryPhotoInputRef}
                id="listing-photo-gallery"
                type="file"
                accept="image/*"
                multiple
                className="add-listing-photo-picker__input"
                tabIndex={-1}
                disabled={
                  submitting ||
                  photosNormalizing ||
                  photos.length >= MAX_LISTING_PHOTOS
                }
                onChange={handlePhotosChange}
              />
              <input
                ref={cameraPhotoInputRef}
                id="listing-photo-camera"
                type="file"
                accept="image/*"
                capture="environment"
                className="add-listing-photo-picker__input"
                tabIndex={-1}
                disabled={
                  submitting ||
                  photosNormalizing ||
                  photos.length >= MAX_LISTING_PHOTOS
                }
                onChange={handlePhotosChange}
              />
              <div className="add-listing-photo-picker__actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    submitting ||
                    photosNormalizing ||
                    photos.length >= MAX_LISTING_PHOTOS
                  }
                  onClick={() => cameraPhotoInputRef.current?.click()}
                >
                  Kamera
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    submitting ||
                    photosNormalizing ||
                    photos.length >= MAX_LISTING_PHOTOS
                  }
                  onClick={() => galleryPhotoInputRef.current?.click()}
                >
                  Dosya seç
                </button>
              </div>
            </div>
            <p className="meta" style={{ marginTop: 6 }}>
              {photosNormalizing
                ? "Fotoğraflar standart boyuta getiriliyor…"
                : (
                  <>
                    Birden fazla seçebilir veya tekrar ekleyerek tamamlayabilirsiniz.
                    {" "}
                    Mobilde Kamera ile çekilen fotoğraf da listeye eklenir.
                  </>
                )}
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
            className="btn btn-nakits-cta"
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
        </form>
      </section>
      )}

      {submissionSuccess ? (
        <div
          className="add-listing-sent"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="add-listing-sent-title"
          aria-describedby="add-listing-sent-desc"
        >
          <div className="add-listing-sent__backdrop" aria-hidden />
          <div className="add-listing-sent__card">
            <div className="add-listing-sent__tick" aria-hidden>
              ✓
            </div>
            <h2 id="add-listing-sent-title" className="add-listing-sent__title">
              İlan gönderildi
            </h2>
            <p id="add-listing-sent-desc" className="add-listing-sent__desc">
              {submissionSuccess.photoCount} fotoğraflı ilanın alındı. Moderasyon
              sonrası yayınlanacak; onaylanınca herkes görebilir.
            </p>
            <p className="add-listing-sent__hint meta">
              Birkaç saniye içinde ana sayfaya yönlendirileceksin.
            </p>
            <button
              type="button"
              className="btn btn-nakits-cta add-listing-sent__cta"
              onClick={() => {
                setSubmissionSuccess(null);
                router.push("/");
                router.refresh();
              }}
            >
              Ana sayfaya git
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
