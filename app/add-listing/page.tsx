"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey,
  sqlCategorySlugFromKey
} from "@/lib/categories";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getDistrictsForProvince } from "@/lib/turkish-districts";
import {
  TURKEY_PROVINCE_COUNT,
  TURKEY_PROVINCES
} from "@/lib/turkish-provinces";

function mapListingInsertError(message: string | undefined): string {
  if (!message) return "İlan kaydedilemedi.";
  const lower = message.toLowerCase();
  if (
    lower.includes("show_phone_on_listing") ||
    (lower.includes("schema cache") && lower.includes("listings"))
  ) {
    return "Veritabanında «telefon ilanda görünsün» için gerekli sütun eksik. Supabase → SQL Editor’da şu dosyadaki komutu bir kez çalıştırın: sql/migration_listing_show_phone.sql — sonra sayfayı yenileyip tekrar deneyin.";
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

export default function AddListingPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState("");
  const [detailCategoryKey, setDetailCategoryKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [categoryRowCount, setCategoryRowCount] = useState<number | null>(null);
  const [showPhoneOnListing, setShowPhoneOnListing] = useState(true);
  const [listingCity, setListingCity] = useState("");
  const [listingDistrict, setListingDistrict] = useState("");

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
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

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

    const fd = new FormData(event.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const city = listingCity.trim();
    const districtTrim = listingDistrict.trim();
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
    if (!(photo instanceof File) || photo.size === 0) {
      setError("Bir fotoğraf seçin.");
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

    const { data: inserted, error: insErr } = await sb
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
        show_phone_on_listing: showPhoneOnListing
      })
      .select("id")
      .single();

    if (insErr || !inserted?.id) {
      setSubmitting(false);
      setError(mapListingInsertError(insErr?.message));
      return;
    }

    const listingId = inserted.id as string;
    const ext = fileExtension(photo);
    const storagePath = `${user.id}/${listingId}/0.${ext}`;

    const { error: upErr } = await sb.storage
      .from("listing-images")
      .upload(storagePath, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: false
      });

    if (upErr) {
      await sb.from("listings").delete().eq("id", listingId);
      setSubmitting(false);
      setError(
        "Fotoğraf yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
      );
      return;
    }

    const {
      data: { publicUrl }
    } = sb.storage.from("listing-images").getPublicUrl(storagePath);

    const { error: imgErr } = await sb.from("listing_images").insert({
      listing_id: listingId,
      image_url: publicUrl,
      sort_order: 0
    });

    if (imgErr) {
      await sb.storage.from("listing-images").remove([storagePath]);
      await sb.from("listings").delete().eq("id", listingId);
      setSubmitting(false);
      setError("İlan görseli kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setSubmitting(false);
    setNotice(
      "İlanınız alındı. Moderasyon sonrası yayınlanacak; onaylanınca herkes görebilir."
    );
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGroupSlug("");
    setDetailCategoryKey("");
    setShowPhoneOnListing(true);
    setListingCity("");
    setListingDistrict("");
    event.currentTarget.reset();
  };

  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

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
              <label htmlFor="listing-price">Fiyat</label>
              <input
                id="listing-price"
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
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
            <label htmlFor="listing-photo">Fotoğraf</label>
            <input
              id="listing-photo"
              name="photo"
              type="file"
              accept="image/*"
              required
              disabled={submitting}
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <div style={{ marginTop: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                <img
                  src={photoPreview}
                  alt="Seçilen fotoğraf önizlemesi"
                  style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10 }}
                />
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
              İşareti kaldırırsanız numaranız gösterilmez; alıcılar satıcıyla yalnızca
              mesaj üzerinden iletişim kurabilir (mesaj özelliği yakında).
            </span>
          </label>

          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Gönderiliyor…" : "İlanı Gönder"}
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
