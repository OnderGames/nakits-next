"use client";

import Image from "next/image";
import Link from "next/link";
import FavoriteHeartButton from "@/components/FavoriteHeartButton";
import {
  formatListingCategoryLineCity,
  formatListingPlaceLine,
  formatPrice,
  formatPriceInputDisplay,
  parsePriceInput
} from "@/lib/categories";
import { listingDetailHref } from "@/lib/listing-code";
import {
  formatListingExpiryDetailTr,
  formatListingExpiryShort,
  listingCanRepublishFromSold
} from "@/lib/listing-policy";
import { formatSellerNameForDisplay } from "@/lib/seller-display";
import type { Listing } from "@/lib/types";

const STATUS_LABEL: Record<NonNullable<Listing["status"]>, string> = {
  pending: "Onay bekliyor",
  active: "Yayında",
  sold: "Satıldı",
  rejected: "Yayınlanmadı"
};

type OwnerToolbar = {
  editHref: string;
  onDelete?: () => void;
  /** Yayındaki ilan için: vitrinden kaldırır (satıldı) */
  onMarkSold?: () => void;
  markSoldBusy?: boolean;
  busy?: boolean;
  /** Onay bekleyen / yayındaki / satıldı (süre varsa) karttan hızlı fiyat */
  priceQuickEdit?: {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    saving?: boolean;
  };
  /** Satıldı ama süresi dolmamış ilanı tekrar vitrine */
  onRepublish?: () => void;
  republishBusy?: boolean;
};

type Props = {
  listing: Listing;
  ownerToolbar?: OwnerToolbar;
  /** Admin önizleme vb.: kalp gizlenir */
  hideFavorite?: boolean;
  /**
   * "vitrin": ana sayfa vitrin ile aynı kompakt kart (arama / tüm ilanlar vitrin uyumu).
   * "browse": şehir, süre vb. dahil klasik liste kartı (üye sayfası, favoriler vb.).
   */
  presentation?: "browse" | "vitrin";
};

export default function ListingCard({
  listing,
  ownerToolbar,
  hideFavorite = false,
  presentation = "browse"
}: Props) {
  if (!ownerToolbar && presentation === "vitrin") {
    const href = listingDetailHref(listing);
    const titleId = `vitrin-title-${listing.id}`;

    return (
      <article className="card card--vitrin">
        <div className="card--vitrin__shell">
          <div className="card--vitrin__surface">
            <div className="card--vitrin__media">
              <Image
                src={listing.image}
                alt=""
                width={280}
                height={280}
                aria-hidden
              />
              {(listing.imageUrls?.length ?? 0) > 1 && (
                <span className="card--vitrin__badge">
                  {listing.imageUrls!.length} fotoğraf
                </span>
              )}
            </div>
            <div className="card-body">
              <h3 id={titleId} className="card--vitrin__title">
                {listing.title}
              </h3>
              <p className="card--vitrin__place">
                {formatListingPlaceLine(listing.city, listing.district)}
              </p>
              <p className="price price--vitrin">{formatPrice(listing.price)}</p>
            </div>
          </div>
          <Link
            href={href}
            className="card--vitrin__cover-link"
            aria-labelledby={titleId}
          />
          {!hideFavorite && (
            <FavoriteHeartButton
              listingId={listing.id}
              sellerId={listing.sellerId}
              variant="vitrin"
            />
          )}
        </div>
      </article>
    );
  }

  const showExpiryForStatus =
    listing.status === "pending" ||
    listing.status === "active" ||
    listing.status === "sold";
  const expiryLine =
    listing.expiresAt && (ownerToolbar ? true : showExpiryForStatus)
      ? ownerToolbar
        ? formatListingExpiryDetailTr(listing.expiresAt)
        : formatListingExpiryShort(listing.expiresAt)
      : null;

  return (
    <article className="card">
      <Link href={listingDetailHref(listing)}>
        <div style={{ position: "relative" }}>
          <Image src={listing.image} alt={listing.title} width={500} height={280} />
          {!ownerToolbar && !hideFavorite && (
            <FavoriteHeartButton
              listingId={listing.id}
              sellerId={listing.sellerId}
              variant="browse"
            />
          )}
          {(listing.imageUrls?.length ?? 0) > 1 && (
            <span
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                padding: "4px 8px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(0,0,0,0.65)",
                color: "#fff"
              }}
            >
              {listing.imageUrls!.length} fotoğraf
            </span>
          )}
        </div>
        <div className="card-body">
          <h3>{listing.title}</h3>
          <p className="price">{formatPrice(listing.price)}</p>
          <p className="meta">
            {formatListingCategoryLineCity(
              listing.city,
              listing.categoryKey,
              listing.district
            )}
          </p>
          {listing.status && (
            <p className="meta">
              {STATUS_LABEL[listing.status] ?? listing.status}
            </p>
          )}
          {listing.listingCode && (
            <p className="meta">İlan no: {listing.listingCode}</p>
          )}
          {ownerToolbar && listing.favoriteCount !== undefined ? (
            <p className="meta listing-card-fav-count">
              <span aria-hidden>♥</span> {listing.favoriteCount} favori
            </p>
          ) : null}
          {expiryLine && <p className="meta">{expiryLine}</p>}
          <p className="meta">{listing.createdAt}</p>
        </div>
      </Link>
      {listing.sellerPublicCode && (
        <div className="listing-seller">
          <span className="listing-seller__label">Satıcı</span>
          <Link
            href={`/kullanici/${listing.sellerPublicCode}`}
            className="listing-seller__name"
          >
            {formatSellerNameForDisplay(listing.seller)}
          </Link>
        </div>
      )}
      {ownerToolbar && (
        <div className="listing-card-owner-toolbar">
          <div className="listing-card-owner-toolbar__row">
            <Link
              href={ownerToolbar.editHref}
              className="btn btn-outline listing-card-owner-toolbar__action"
            >
              Düzenle
            </Link>
            {listing.status === "active" && ownerToolbar.onMarkSold && (
              <button
                type="button"
                className="btn btn-outline listing-card-owner-toolbar__action"
                style={{
                  borderColor: "#bbf7d0",
                  color: "#166534"
                }}
                disabled={Boolean(ownerToolbar.busy || ownerToolbar.markSoldBusy)}
                onClick={(e) => {
                  e.preventDefault();
                  ownerToolbar.onMarkSold?.();
                }}
              >
                {ownerToolbar.markSoldBusy ? "İşleniyor…" : "Satıldı"}
              </button>
            )}
            {listing.status === "sold" &&
              ownerToolbar.onRepublish &&
              listingCanRepublishFromSold(listing.expiresAt) && (
                <button
                  type="button"
                  className="btn btn-primary listing-card-owner-toolbar__action"
                  disabled={Boolean(
                    ownerToolbar.busy ||
                      ownerToolbar.markSoldBusy ||
                      ownerToolbar.republishBusy
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    ownerToolbar.onRepublish?.();
                  }}
                >
                  {ownerToolbar.republishBusy ? "Yükleniyor…" : "Tekrar yayına al"}
                </button>
              )}
            {ownerToolbar.onDelete && (
              <button
                type="button"
                className="btn btn-outline listing-card-owner-toolbar__action"
                style={{
                  color: "#b91c1c",
                  borderColor: "#fecaca"
                }}
                disabled={ownerToolbar.busy}
                onClick={(e) => {
                  e.preventDefault();
                  ownerToolbar.onDelete?.();
                }}
              >
                {ownerToolbar.busy ? "Siliniyor…" : "Sil"}
              </button>
            )}
          </div>
          {listing.status === "sold" &&
            !listingCanRepublishFromSold(listing.expiresAt) && (
              <p className="meta listing-card-owner-toolbar__hint">
                Süre doldu; yeni ilan açın
              </p>
            )}
        </div>
      )}
      {ownerToolbar?.priceQuickEdit && (
        <div
          style={{
            padding: "12px 12px 14px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-muted, rgba(0,0,0,0.02))"
          }}
        >
          <label
            htmlFor={`quick-price-${listing.id}`}
            className="meta"
            style={{ display: "block", marginBottom: 6 }}
          >
            Fiyatı güncelle (TL)
          </label>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center"
            }}
          >
            <input
              id={`quick-price-${listing.id}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={ownerToolbar.priceQuickEdit.value}
              onChange={(e) =>
                ownerToolbar.priceQuickEdit?.onChange(e.target.value)
              }
              onBlur={() => {
                const q = ownerToolbar.priceQuickEdit;
                if (!q) return;
                const n = parsePriceInput(q.value);
                if (Number.isFinite(n) && n >= 0) {
                  q.onChange(formatPriceInputDisplay(n));
                }
              }}
              disabled={Boolean(ownerToolbar.priceQuickEdit.saving)}
              placeholder="Örn: 1.500"
              style={{
                flex: "1 1 140px",
                minWidth: 120,
                maxWidth: "100%"
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 14, padding: "8px 16px" }}
              disabled={Boolean(
                ownerToolbar.busy ||
                  ownerToolbar.priceQuickEdit.saving ||
                  ownerToolbar.markSoldBusy ||
                  ownerToolbar.republishBusy
              )}
              onClick={(e) => {
                e.preventDefault();
                ownerToolbar.priceQuickEdit?.onSave();
              }}
            >
              {ownerToolbar.priceQuickEdit.saving
                ? "Kaydediliyor…"
                : "Fiyatı kaydet"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
