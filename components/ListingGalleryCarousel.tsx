"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export default function ListingGalleryCarousel({ images, title }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const el = stripRef.current;
    if (!el || images.length === 0) return;
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    const slide = el.children.item(clamped) as HTMLElement | null;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, [images.length]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el || images.length <= 1) return;

    const syncActive = () => {
      const slideW = el.firstElementChild?.clientWidth ?? el.clientWidth;
      if (slideW <= 0) return;
      const idx = Math.round(el.scrollLeft / slideW);
      setActive(Math.min(idx, images.length - 1));
    };

    el.addEventListener("scroll", syncActive, { passive: true });
    syncActive();
    return () => el.removeEventListener("scroll", syncActive);
  }, [images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={stripRef}
        className="listing-gallery-strip"
        style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--panel-bg, #f8fafc)"
        }}
        aria-roledescription="carousel"
        aria-label={`${title} — fotoğraf galerisi`}
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
              minWidth: "100%",
              position: "relative",
              aspectRatio: "4 / 3",
              maxHeight: "min(72vh, 520px)"
            }}
          >
            <Image
              src={src}
              alt={
                images.length > 1
                  ? `${title} — fotoğraf ${i + 1} / ${images.length}`
                  : title
              }
              fill
              sizes="(max-width: 900px) 100vw, 640px"
              style={{
                objectFit: "contain"
              }}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              className="btn"
              style={{
                padding: "6px 14px",
                minHeight: 36,
                opacity: active <= 0 ? 0.45 : 1
              }}
              disabled={active <= 0}
              onClick={() => scrollToIndex(active - 1)}
              aria-label="Önceki fotoğraf"
            >
              ‹ Önceki
            </button>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center"
              }}
              aria-hidden
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Fotoğraf ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                  style={{
                    width: i === active ? 10 : 8,
                    height: i === active ? 10 : 8,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    background:
                      i === active ? "var(--primary, #2563eb)" : "var(--border)",
                    cursor: "pointer"
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="btn"
              style={{
                padding: "6px 14px",
                minHeight: 36,
                opacity: active >= images.length - 1 ? 0.45 : 1
              }}
              disabled={active >= images.length - 1}
              onClick={() => scrollToIndex(active + 1)}
              aria-label="Sonraki fotoğraf"
            >
              Sonraki ›
            </button>
          </div>
          <p className="meta" style={{ textAlign: "center", marginTop: 6 }}>
            Parmakla veya fareyle galeriyi yatay kaydırabilirsiniz ({images.length}{" "}
            fotoğraf).
          </p>
        </>
      )}
    </div>
  );
}
