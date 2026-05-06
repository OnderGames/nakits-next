"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef
} from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Alt sabit aksiyon (örn. Uygula düğmesi) */
  footer?: React.ReactNode;
};

/** İlanlar sayfası mobil: soldan filtre çekmesi (kategori çekmesi ile aynı görsel dil) */
export default function ListingsFilterDrawer({
  open,
  onClose,
  title = "Filtrele",
  children,
  footer
}: Props) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    onClose();
    prevActiveRef.current?.focus?.();
    prevActiveRef.current = null;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    prevActiveRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="home-category-drawer__backdrop"
        aria-label="Filtre panelini kapat"
        tabIndex={-1}
        onClick={close}
      />
      <section
        className="home-category-drawer listings-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-category-drawer__top">
          <h2 id={titleId} className="home-category-drawer__title">
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="home-category-drawer__close"
            onClick={close}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="listings-filter-drawer__body">{children}</div>

        {footer ? (
          <div className="listings-filter-drawer__footer">{footer}</div>
        ) : null}
      </section>
    </>
  );
}
