"use client";

import type { ChangeEvent, RefObject } from "react";
import { useLayoutEffect, useRef } from "react";
import {
  caretIndexAfterPriceDigits,
  countPriceDigitsPrefix,
  formatPriceInputDisplay,
  parsePriceInput
} from "@/lib/categories";

/** TL fiyat kutusu: yazarken 1000→1.000; imleç rakam sırasına göre korunur */
export function useLiveTrPriceInput(
  displayValue: string,
  setDisplayValue: (next: string) => void
): {
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
} {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretDigits = useRef<number | null>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const raw = el.value;
    const digits = countPriceDigitsPrefix(raw, caret);

    if (!raw.trim()) {
      pendingCaretDigits.current = 0;
      setDisplayValue("");
      return;
    }

    const n = parsePriceInput(raw);
    if (!Number.isFinite(n) || n < 0) {
      pendingCaretDigits.current = null;
      setDisplayValue(raw);
      return;
    }

    pendingCaretDigits.current = digits;
    setDisplayValue(formatPriceInputDisplay(n));
  }

  useLayoutEffect(() => {
    const d = pendingCaretDigits.current;
    if (d === null) return;
    pendingCaretDigits.current = null;
    const el = inputRef.current;
    if (!el || (typeof document !== "undefined" && document.activeElement !== el)) {
      return;
    }
    const len = displayValue.length;
    const nextPos = Math.min(
      caretIndexAfterPriceDigits(displayValue, d),
      len
    );
    try {
      el.setSelectionRange(nextPos, nextPos);
    } catch {
      /* input tipi/date vb. seçim desteklemeyebilir — atla */
    }
  }, [displayValue]);

  function onBlur() {
    pendingCaretDigits.current = null;
    const n = parsePriceInput(displayValue);
    if (!Number.isFinite(n) || n < 0) return;
    setDisplayValue(formatPriceInputDisplay(n));
  }

  return { inputRef, onChange, onBlur };
}
