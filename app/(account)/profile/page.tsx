"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  fetchListingDurationDaysPublic,
  LISTING_DURATION_DEFAULT_DAYS
} from "@/lib/site-settings";
import {
  fetchSellerActiveListings,
  removeListingImagesFolderFromStorage
} from "@/lib/listings-data";
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

function getInitialsFromName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ");
  if (!cleaned) return "Ü";

  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0]!;
    return (w.slice(0, 2) || w[0] || "Ü").toUpperCase();
  }

  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  const i1 = first[0] ?? "";
  const i2 = last[0] ?? "";
  return `${i1}${i2}`.toUpperCase() || "Ü";
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
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listingActionError, setListingActionError] = useState("");
  const [listingDurationDays, setListingDurationDays] = useState(
    LISTING_DURATION_DEFAULT_DAYS
  );

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;
    void fetchListingDurationDaysPublic(sb).then(setListingDurationDays);
  }, []);

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
    void fetchSellerActiveListings(sb, userId, 6).then(setActiveListings);
  }, [userId]);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) {
      setProfileChecked(false);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) return;
    let cancelled = false;
    setProfileChecked(false);
    setProfileLoadError("");
    void (async () => {
      const [{ data: prof, error: pe }, { data: authData }] = await Promise.all([
        sb.from("profiles").select("full_name, phone, public_code").eq("id", userId).maybeSingle(),
        sb.auth.getUser()
      ]);
      if (cancelled) return;
      if (pe) {
        setProfileLoadError(pe.message);
        setProfileChecked(true);
        return;
      }
      const meta = authData.user?.user_metadata as
        | { full_name?: string; phone?: string }
        | undefined;
      const metaName = meta?.full_name?.trim() ?? "";
      const metaPhone = meta?.phone?.trim() ?? "";
      const profName = prof?.full_name?.trim() ?? "";
      const profPhone = prof?.phone?.trim() ?? "";

      const displayName = profName || metaName;
      const displayPhone = profPhone || metaPhone;
      setFullName(displayName);
      setPhone(displayPhone);
      const pc = (prof?.public_code as string | undefined)?.trim();
      setPublicCode(pc && pc.length > 0 ? pc : null);

      const needsName = !profName && Boolean(metaName);
      const needsPhone = !profPhone && Boolean(metaPhone);
      if (needsName || needsPhone) {
        const { error: syncErr } = await sb
          .from("profiles")
          .update({
            ...(needsName ? { full_name: metaName } : {}),
            ...(needsPhone ? { phone: metaPhone } : {})
          })
          .eq("id", userId);
        if (!cancelled && syncErr) {
          setProfileLoadError(syncErr.message);
        }
      }
      if (!cancelled) setProfileChecked(true);
    })();
    return () => {
      cancelled = true;
    };
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
    void fetchSellerActiveListings(sb, userId, 6).then(setActiveListings);
  }

  const handleMarkSoldFromProfile = useCallback(
    async (listingId: string) => {
      if (!userId) return;
      if (
        !window.confirm(
          "İlanı «satıldı» olarak işaretlemek istiyor musunuz? Vitrinden kalkar."
        )
      ) {
        return;
      }
      const sb = getSupabaseBrowser();
      if (!sb) return;
      setListingActionError("");
      setMarkingSoldId(listingId);
      try {
        const { error } = await sb
          .from("listings")
          .update({ status: "sold" })
          .eq("id", listingId)
          .eq("seller_id", userId);
        if (error) {
          setListingActionError(error.message);
          return;
        }
        setActiveListings((prev) =>
          prev.filter((x) => x.id !== listingId)
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
      setListingActionError("");
      setDeletingId(listingId);
      try {
        await removeListingImagesFolderFromStorage(sb, userId, listingId);
        const { error } = await sb.from("listings").delete().eq("id", listingId);
        if (error) {
          setListingActionError(error.message);
          return;
        }
        setActiveListings((prev) => prev.filter((x) => x.id !== listingId));
      } finally {
        setDeletingId(null);
      }
    },
    [userId]
  );

  if (!ready) {
    return (
      <div className="account-page">
        <p className="meta">Yükleniyor…</p>
      </div>
    );
  }

  if (hasSupabaseConfig && !email) {
    return (
      <div className="account-page">
        <h1 className="section-title">Profil yönetimi</h1>
        <section className="panel auth-wall">
          <p>Profilini görmek için giriş yap.</p>
          <div className="auth-wall__actions">
            <Link
              className="nav-pill nav-pill--login"
              href="/login?next=/profile"
            >
              Giriş yap
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const shown =
    hasSupabaseConfig && userId
      ? activeListings
      : mockListings.slice(0, 2);

  const welcome = displayWelcomeName(fullName, email);
  const initials = getInitialsFromName(fullName || email || "");
  const badgeText = publicCode
    ? `Üye #${publicCode}`
    : email
      ? email.split("@")[0]
      : "Üye";

  return (
    <div className="account-page">
      <h1 className="section-title">Profil yönetimi</h1>
      <section className="panel profile-card">
        <div className="profile-card__top">
          <div className="profile-card__avatar" aria-hidden>
            {initials}
          </div>
          <div className="profile-card__topText">
            <p className="profile-card__welcome">Hoş geldin, {welcome}</p>
            <div className="profile-card__badge">{badgeText}</div>
          </div>
        </div>

        {hasSupabaseConfig &&
          userId &&
          profileChecked &&
          !publicCode &&
          !profileLoadError && (
            <p className="notice profile-card__notice">
              Üye numaran veritabanında henüz yok. Supabase → SQL Editor&apos;da
              önce{" "}
              <code style={{ fontSize: 13 }}>
                sql/migration_profiles_public_code.sql
              </code>{" "}
              dosyasını çalıştır; hâlâ boşsa{" "}
              <code style={{ fontSize: 13 }}>
                sql/fix_profiles_public_code_nulls.sql
              </code>
              . Sonra sayfayı yenile. Canlı sitede görmek için projeyi deploy et.
            </p>
          )}

        {hasSupabaseConfig && userId ? (
          <form className="profile-card__form" onSubmit={(e) => void handleSaveProfile(e)}>
            <div className="profile-card__grid">
              <div className="profile-card__field">
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
              </div>

              <div className="profile-card__field">
                <label htmlFor="profile-phone">Telefon</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Örn: 05xx xxx xx xx"
                  disabled={saving}
                  autoComplete="tel"
                />
              </div>

              <div className="profile-card__field profile-card__field--static">
                <span className="profile-card__label">E-posta</span>
                <span className="profile-card__value">
                  {email ?? "—"}
                </span>
              </div>

              <div className="profile-card__field profile-card__field--static">
                <span className="profile-card__label">Üye numarası</span>
                {publicCode ? (
                  <span className="profile-card__member">
                    <Link
                      href={`/kullanici/${publicCode}`}
                      className="profile-card__member-link"
                    >
                      {publicCode}
                    </Link>
                    <span className="profile-card__member-sub">
                      Paylaşılabilir adres:{" "}
                      <strong className="profile-card__member-url">
                        …/kullanici/{publicCode}
                      </strong>
                    </span>
                  </span>
                ) : (
                  <span className="profile-card__value profile-card__value--muted">—</span>
                )}
              </div>
            </div>

            <p className="profile-card__hint meta">
              İsteğe bağlı. İlanlarda telefon gösterilmez; alıcılar satıcıyla yalnızca
              mesaj kutusu üzerinden iletişir.
            </p>

            <div className="profile-card__actions">
              <button
                type="submit"
                className="btn btn-nakits-cta"
                disabled={saving}
              >
                {saving ? "Kaydediliyor…" : "Profili kaydet"}
              </button>
            </div>

            {saveNotice && <p className="notice profile-card__notice">{saveNotice}</p>}

            {profileLoadError && (
              <p
                className="notice profile-card__notice"
                style={{
                  background: "#fee2e2",
                  borderColor: "#fecaca",
                  color: "#7f1d1d"
                }}
              >
                {profileLoadError}
              </p>
            )}
          </form>
        ) : (
          <div className="profile-card__grid profile-card__grid--static">
            <div className="profile-card__field profile-card__field--static">
              <span className="profile-card__label">Ad soyad</span>
              <span className="profile-card__value">
                {fullName.trim() || "—"}
              </span>
            </div>
            <div className="profile-card__field profile-card__field--static">
              <span className="profile-card__label">Telefon</span>
              <span className="profile-card__value">
                {phone.trim() || "—"}
              </span>
            </div>
            <div className="profile-card__field profile-card__field--static">
              <span className="profile-card__label">E-posta</span>
              <span className="profile-card__value">{email ?? "—"}</span>
            </div>
            <div className="profile-card__field profile-card__field--static">
              <span className="profile-card__label">Üye numarası</span>
              <span className="profile-card__value profile-card__value--muted">
                {publicCode ?? "—"}
              </span>
            </div>
          </div>
        )}
      </section>

      <h2 className="section-title">Yayındaki ilanlarım</h2>
      <p className="meta" style={{ marginBottom: 12 }}>
        Yayındaki her ilan <strong>{listingDurationDays} gün</strong> süreyle
        listelenir; aşağıdaki
        kartlarda <strong>yayından kalkma tarihi</strong> ve kalan gün
        bilgisini görebilirsiniz. Süre dolunca ilan otomatik silinir. En fazla 3
        onay bekleyen veya yayındaki ilanınız olabilir. Alıcıyla anlaştıysanız
        «Satıldı» ile vitrinden kaldırabilirsiniz. Onay bekleyen ilanlar bu
        özetde yok;{" "}
        <Link href="/ilanlarim" style={{ color: "var(--primary)" }}>
          tüm ilanlarım
        </Link>{" "}
        sayfasından takip edebilirsiniz.
      </p>
      {listingActionError && (
        <p
          className="notice"
          style={{
            marginBottom: 12,
            background: "#fee2e2",
            borderColor: "#fecaca",
            color: "#7f1d1d"
          }}
        >
          {listingActionError}
        </p>
      )}
      {hasSupabaseConfig && shown.length === 0 && (
        <section className="panel account-empty-panel">
          <p className="account-empty-panel__text">
            Henüz yayındaki ilanın yok (onay bekleyenler burada listelenmez).
          </p>
          <Link className="btn btn-nakits-outline account-empty-panel__cta" href="/ilanlarim">
            Tüm ilanlarımı aç
          </Link>
        </section>
      )}
      <section className="cards">
        {shown.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            ownerToolbar={{
              editHref: `/ilanlarim/${listing.id}/duzenle`,
              onMarkSold: () => void handleMarkSoldFromProfile(listing.id),
              markSoldBusy: markingSoldId === listing.id,
              onDelete: () => void handleDeleteListing(listing.id),
              busy: deletingId === listing.id
            }}
          />
        ))}
      </section>
      <p className="meta" style={{ marginTop: 20 }}>
        <Link href="/ilanlarim">Tüm ilanlarım</Link>
      </p>
    </div>
  );
}
