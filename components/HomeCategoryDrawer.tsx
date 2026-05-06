"use client";

import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import { HOME_CATEGORY_DRAWER_OPEN_EVENT } from "@/lib/open-home-category-drawer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";

type Props = {
  counts: Record<string, number>;
};

export default function HomeCategoryDrawer({ counts }: Props) {
  const router = useRouter();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    prevActiveRef.current?.focus?.();
    prevActiveRef.current = null;
  }, []);

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
    function onOpen() {
      prevActiveRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    }
    window.addEventListener(
      HOME_CATEGORY_DRAWER_OPEN_EVENT,
      onOpen as EventListener
    );
    return () =>
      window.removeEventListener(
        HOME_CATEGORY_DRAWER_OPEN_EVENT,
        onOpen as EventListener
      );
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submitKeyword(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/listings?q=${encodeURIComponent(trimmed)}` : "/listings");
    close();
    setQ("");
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="home-category-drawer__backdrop"
        aria-label="Kategoriler panelini kapat"
        tabIndex={-1}
        onClick={close}
      />
      <section
        className="home-category-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-category-drawer__top">
          <h2 id={titleId} className="home-category-drawer__title">
            Kategoriler
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

        <form
          className="home-category-drawer__search"
          onSubmit={submitKeyword}
          role="search"
          aria-label="İlan ara"
        >
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kelime ile ara…"
            autoComplete="off"
            maxLength={120}
            enterKeyHint="search"
            className="home-category-drawer__search-input"
          />
          <button type="submit" className="home-category-drawer__search-go">
            Ara
          </button>
        </form>

        <p className="home-category-drawer__hint meta">
          <Link href="/listings" onClick={close}>
            Tüm ilanlar — şehir ve ilçe filtresi
          </Link>
        </p>

        <div className="home-category-drawer__scroll">
          <div className="home-category-drawer__sidebar-mount">
            <HomeCategorySidebar counts={counts} embedded />
          </div>
        </div>
      </section>
    </>
  );
}

