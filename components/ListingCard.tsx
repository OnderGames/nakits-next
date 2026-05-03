"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatListingCategoryLineCity,
  formatPrice,
  formatPriceInputDisplay,
  parsePriceInput
} from "@/lib/categories";
import {
  formatListingExpiryDetailTr,
  formatListingExpiryShort,
  listingCanRepublishFromSold
} from "@/lib/listing-policy";
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
};

export default function ListingCard({ listing, ownerToolbar }: Props) {
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
      <Link href={`/listings/${listing.id}`}>
        <div style={{ position: "relative" }}>
          <Image src={listing.image} alt={listing.title} width={500} height={280} />
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
          {expiryLine && <p className="meta">{expiryLine}</p>}
          <p className="meta">{listing.createdAt}</p>
        </div>
      </Link>
      {listing.sellerPublicCode && (
        <p className="meta" style={{ padding: "0 12px 12px", margin: 0 }}>
          Satıcı:{" "}
          <Link
            href={`/kullanici/${listing.sellerPublicCode}`}
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            {listing.seller}
          </Link>
        </p>
      )}
      {ownerToolbar && (
        <div
          style={{
            padding: "10px 12px 14px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <Link
            href={ownerToolbar.editHref}
            className="btn btn-outline"
            style={{ fontSize: 14, padding: "8px 14px" }}
          >
            Düzenle
          </Link>
          {listing.status === "active" && ownerToolbar.onMarkSold && (
            <button
              type="button"
              className="btn btn-outline"
              style={{
                fontSize: 14,
                padding: "8px 14px",
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
                className="btn btn-primary"
                style={{ fontSize: 14, padding: "8px 14px" }}
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
          {listing.status === "sold" &&
            !listingCanRepublishFromSold(listing.expiresAt) && (
              <span className="meta" style={{ fontSize: 13 }}>
                Süre doldu; yeni ilan açın
              </span>
            )}
          {ownerToolbar.onDelete && (
            <button
              type="button"
              className="btn btn-outline"
              style={{
                fontSize: 14,
                padding: "8px 14px",
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
