"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";

export default function AddListingPage() {
  const [notice, setNotice] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState("");
  const [detailCategoryKey, setDetailCategoryKey] = useState("");

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("İlanınız alındı. Moderasyon sonrası yayınlanacak.");
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGroupSlug("");
    setDetailCategoryKey("");
    event.currentTarget.reset();
  };

  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

  return (
    <main className="container">
      <h1 className="section-title">İlan ver</h1>
      <section className="panel">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div>
              <label>Başlık</label>
              <input required type="text" placeholder="Örn: iPhone 14 256 GB" />
            </div>
            <div>
              <label>Fiyat</label>
              <input required type="number" min="0" placeholder="0" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label>Ana kategori</label>
              <select
                required
                value={groupSlug}
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
                disabled={!groupSlug}
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
              <label>Şehir</label>
              <select required>
                <option value="">Seçiniz</option>
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
                <option>Bursa</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Açıklama</label>
            <textarea required rows={6} placeholder="Ürünü detaylı açıklayın" />
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="listing-photo">Fotoğraf</label>
            <input
              id="listing-photo"
              name="photo"
              type="file"
              accept="image/*"
              required
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

          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit">
            İlanı Gönder
          </button>
          {notice && (
            <p className="notice" style={{ marginTop: 10 }}>
              {notice}
            </p>
          )}
        </form>
      </section>
      <p className="footer">Nakits MVP — İlan girişi</p>
    </main>
  );
}
