"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

type Props = {
  images: string[];
  title: string;
};

export default function ListingGalleryCarousel({ images, title }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const galleryRootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [galleryHover, setGalleryHover] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = stripRef.current;
      if (!el || images.length === 0) return;
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      setActive(clamped);
      const slide = el.children.item(clamped) as HTMLElement | null;
      slide?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest"
      });
    },
    [images.length]
  );

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

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxOpen && e.key === "Escape") {
        e.preventDefault();
        setLightboxOpen(false);
        return;
      }

      if (images.length <= 1) return;

      const root = galleryRootRef.current;
      const ae = document.activeElement;
      const focusedInside =
        Boolean(root) &&
        (root === ae || Boolean(root && ae && root.contains(ae)));

      if (!lightboxOpen && !galleryHover && !focusedInside) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(activeRef.current - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(activeRef.current + 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, lightboxOpen, galleryHover, scrollToIndex]);

  if (images.length === 0) {
    return null;
  }

  const lightbox =
    portalReady &&
    lightboxOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="listing-gallery-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — büyük fotoğraf`}
      >
        <button
          type="button"
          className="listing-gallery-lightbox__backdrop"
          aria-label="Kapat"
          onClick={() => setLightboxOpen(false)}
        />
        <div className="listing-gallery-lightbox__inner">
          <div className="listing-gallery-lightbox__top">
            <span className="listing-gallery-lightbox__counter">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              className="btn btn-outline listing-gallery-lightbox__close"
              onClick={() => setLightboxOpen(false)}
            >
              Kapat
            </button>
          </div>
          <div className="listing-gallery-lightbox__stage">
            <Image
              key={`lb-${active}-${images[active]}`}
              src={images[active]}
              alt={
                images.length > 1
                  ? `${title} — fotoğraf ${active + 1} / ${images.length}`
                  : title
              }
              fill
              sizes="100vw"
              className="listing-gallery-lightbox__img"
              priority
            />
          </div>
          {images.length > 1 ? (
            <div className="listing-gallery-lightbox__nav">
              <button
                type="button"
                className="btn btn-outline"
                disabled={active <= 0}
                onClick={() => scrollToIndex(active - 1)}
                aria-label="Önceki fotoğraf"
              >
                ‹ Önceki
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={active >= images.length - 1}
                onClick={() => scrollToIndex(active + 1)}
                aria-label="Sonraki fotoğraf"
              >
                Sonraki ›
              </button>
            </div>
          ) : null}
          {images.length > 1 ? (
            <p className="listing-gallery-lightbox__hint meta">
              ← → ile gezin · Esc ile kapat
            </p>
          ) : (
            <p className="listing-gallery-lightbox__hint meta">
              Esc ile kapat
            </p>
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {lightbox}
      <div
        ref={galleryRootRef}
        className="listing-gallery-root"
        tabIndex={0}
        onMouseEnter={() => setGalleryHover(true)}
        onMouseLeave={() => setGalleryHover(false)}
        aria-label={`${title} fotoğrafları — odaklayıp sol ve sağ ok ile gezinebilir veya büyük görüntüleyebilirsiniz`}
        style={{ position: "relative", width: "100%" }}
      >
        <div className="listing-gallery-toolbar">
          {images.length > 1 ? (
            <span className="listing-gallery-toolbar__hint meta">
              Çoklu fotoğraf: kaydırın veya ok tuşlarıyla gezinin.
            </span>
          ) : null}
          <button
            type="button"
            className="btn btn-outline listing-gallery-toolbar__enlarge"
            onClick={() => setLightboxOpen(true)}
          >
            Büyük görüntüle
          </button>
        </div>

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
            <div className="listing-gallery-controls">
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
                className="listing-gallery-dots"
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
                        i === active
                          ? "var(--primary, #2563eb)"
                          : "var(--border)",
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
            <p className="meta listing-gallery-footnote">
              Parmakla veya fareyle kaydırın. Fare galerinin üzerindeyken veya
              alanı klavye ile odakladığınızda{" "}
              <kbd className="listing-gallery-kbd">←</kbd>{" "}
              <kbd className="listing-gallery-kbd">→</kbd> ile gezinin;{" "}
              <strong>Büyük görüntüle</strong> ile tam ekrana yakın önizleme ve
              aynı ok kısayolları.
            </p>
          </>
        )}
        {images.length === 1 ? (
          <p className="meta listing-gallery-footnote listing-gallery-footnote--single">
            Daha net görmek için <strong>Büyük görüntüle</strong> kullanabilirsiniz.
          </p>
        ) : null}
      </div>
    </>
  );
}
