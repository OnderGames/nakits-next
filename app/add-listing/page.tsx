"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  CATEGORY_GROUPS,
  compositeCategoryKey
} from "@/lib/categories";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import {
  TURKEY_PROVINCE_COUNT,
  TURKEY_PROVINCES
} from "@/lib/turkish-provinces";

export default function AddListingPage() {
  const [notice, setNotice] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState("");
  const [detailCategoryKey, setDetailCategoryKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

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
              <label htmlFor="listing-city">
                Şehir{" "}
                <span className="meta" style={{ fontWeight: 400 }}>
                  ({TURKEY_PROVINCE_COUNT} il)
                </span>
              </label>
              <select id="listing-city" name="city" required>
                <option value="">Seçiniz</option>
                {TURKEY_PROVINCES.map((il) => (
                  <option key={il} value={il}>
                    {il}
                  </option>
                ))}
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
