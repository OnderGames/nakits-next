"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { fetchSellerActiveListings } from "@/lib/listings-data";
import { listings as mockListings } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

function displayWelcomeName(fullName: string, email: string | null) {
  const t = fullName.trim();
  if (t) return t;
  if (email) return email.split("@")[0] ?? "Üye";
  return "Üye";
}

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoadError, setProfileLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) {
      if (!userId) setActiveListings([]);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void fetchSellerActiveListings(sb, userId, 2).then(setActiveListings);
  }, [userId]);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    setProfileLoadError("");
    void sb
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setProfileLoadError(error.message);
          return;
        }
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
      });
  }, [userId]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveNotice("");
    const sb = getSupabaseBrowser();
    if (!sb || !userId) return;
    setSaving(true);
    const { error } = await sb
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setProfileLoadError(error.message);
      return;
    }
    setSaveNotice("Profilin kaydedildi.");
    void fetchSellerActiveListings(sb, userId, 2).then(setActiveListings);
  }

  if (!ready) {
    return (
      <main className="container">
        <p className="meta">Yükleniyor…</p>
      </main>
    );
  }

  if (hasSupabaseConfig && !email) {
    return (
      <main className="container">
        <h1 className="section-title">Profilim</h1>
        <section className="panel auth-wall">
          <p>Profilini görmek için giriş yap.</p>
          <Link
            className="btn btn-primary"
            style={{ display: "inline-block", marginTop: 14 }}
            href="/login?next=/profile"
          >
            Giriş yap
          </Link>
        </section>
      </main>
    );
  }

  const shown =
    hasSupabaseConfig && userId
      ? activeListings
      : mockListings.slice(0, 2);

  const welcome = displayWelcomeName(fullName, email);

  return (
    <main className="container">
      <h1 className="section-title">Profilim</h1>
      <section className="panel">
        <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
          Hoş geldin, {welcome}
        </p>
        <p className="meta" style={{ marginBottom: 16 }}>
          {email ?? "—"}
        </p>

        {hasSupabaseConfig && userId && (
          <form onSubmit={(e) => void handleSaveProfile(e)}>
            <label htmlFor="profile-fullname">Ad soyad</label>
            <input
              id="profile-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Örn: Murat Güneş"
              disabled={saving}
              autoComplete="name"
            />
            <label htmlFor="profile-phone" style={{ marginTop: 12 }}>
              Telefon
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Örn: 05xx xxx xx xx"
              disabled={saving}
              autoComplete="tel"
            />
            <p className="meta" style={{ marginTop: 8 }}>
              İlan verirken telefonunu göstermeyi seçersen bu numara kullanılır.
            </p>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : "Profili kaydet"}
            </button>
            {saveNotice && (
              <p className="notice" style={{ marginTop: 12 }}>
                {saveNotice}
              </p>
            )}
            {profileLoadError && (
              <p
                className="notice"
                style={{
                  marginTop: 12,
                  background: "#fee2e2",
                  borderColor: "#fecaca",
                  color: "#7f1d1d"
                }}
              >
                {profileLoadError}
              </p>
            )}
          </form>
        )}
      </section>

      <h2 className="section-title">Yayındaki ilanlarım</h2>
      {hasSupabaseConfig && shown.length === 0 && (
        <p className="meta">
          Henüz yayındaki ilanın yok (onay bekleyenler dahil değil).
        </p>
      )}
      <section className="cards">
        {shown.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>
      <p className="footer">
        <Link href="/ilanlarim">Tüm ilanlarım</Link>
      </p>
      <p className="footer">Nakits MVP — Profil</p>
    </main>
  );
}
