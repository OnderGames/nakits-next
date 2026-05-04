"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_GROUPS,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  compositeCategoryKey,
  konutLeafCategorySubSlug,
  labelKonutLeafCategory,
  tryParseKonutLeafSubSlug,
  type CategoryGroupDef,
  type SubcategoryDef
} from "@/lib/categories";

export type CategoryMillerPickerProps = {
  groupSlug: string;
  detailCategoryKey: string;
  onGroupChange: (slug: string) => void;
  onCategoryKeyChange: (key: string) => void;
  disabled?: boolean;
};

/** İlan kaydında ara adım: doğrudan böyle yazılmamalı (tam yaprak gerekli) */
export const GAYRIMENKUL_KONUT_DRAFT_KEY = "gayrimenkul.konut";

export default function CategoryMillerPicker({
  groupSlug,
  detailCategoryKey,
  onGroupChange,
  onCategoryKeyChange,
  disabled = false
}: CategoryMillerPickerProps) {
  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

  const [konutFlow, setKonutFlow] = useState(false);
  const [konutTxn, setKonutTxn] = useState<
    (typeof KONUT_LISTING_KINDS)[number]["slug"] | ""
  >("");

  useEffect(() => {
    if (!detailCategoryKey) {
      setKonutFlow(false);
      setKonutTxn("");
      return;
    }
    if (!detailCategoryKey.startsWith("gayrimenkul.")) {
      setKonutFlow(false);
      setKonutTxn("");
      return;
    }
    const sub = detailCategoryKey.slice("gayrimenkul.".length);
    const leafTry = tryParseKonutLeafSubSlug(sub);
    if (leafTry) {
      setKonutFlow(true);
      setKonutTxn(leafTry.txn);
      return;
    }
    if (sub === "konut") {
      setKonutFlow(true);
      setKonutTxn("");
      return;
    }
    setKonutFlow(false);
    setKonutTxn("");
  }, [detailCategoryKey]);

  const leafParsed =
    detailCategoryKey.startsWith("gayrimenkul.")
      ? tryParseKonutLeafSubSlug(detailCategoryKey.slice("gayrimenkul.".length))
      : null;

  const crumbText = useMemo(() => {
    if (!selectedGroup) return "Kategori seçin";
    if (leafParsed) {
      return `${selectedGroup.name} › ${labelKonutLeafCategory(leafParsed.txn, leafParsed.prop)}`;
    }
    if (konutFlow && detailCategoryKey === GAYRIMENKUL_KONUT_DRAFT_KEY) {
      const txnLabel = KONUT_LISTING_KINDS.find((k) => k.slug === konutTxn)?.name;
      return txnLabel
        ? `${selectedGroup.name} › Konut › ${txnLabel}`
        : `${selectedGroup.name} › Konut`;
    }
    if (!detailCategoryKey) return `${selectedGroup.name}`;
    const pref = `${selectedGroup.slug}.`;
    if (!detailCategoryKey.startsWith(pref)) return `${selectedGroup.name}`;
    const subSlug = detailCategoryKey.slice(pref.length);
    const sub = selectedGroup.subs.find((s) => s.slug === subSlug);
    if (sub) return `${selectedGroup.name} › ${sub.name}`;
    return `${selectedGroup.name}`;
  }, [detailCategoryKey, konutFlow, konutTxn, leafParsed, selectedGroup]);

  function onPickGroup(slug: string) {
    onGroupChange(slug);
    onCategoryKeyChange("");
    setKonutFlow(false);
    setKonutTxn("");
  }

  function onPickLeafSub(group: CategoryGroupDef, sub: SubcategoryDef) {
    if (group.slug === "gayrimenkul" && sub.drilldown === "konut") {
      setKonutFlow(true);
      setKonutTxn("");
      onCategoryKeyChange(GAYRIMENKUL_KONUT_DRAFT_KEY);
      return;
    }
    setKonutFlow(false);
    setKonutTxn("");
    onCategoryKeyChange(compositeCategoryKey(group.slug, sub.slug));
  }

  const col3Active = groupSlug === "gayrimenkul" && konutFlow && konutTxn === "" && !leafParsed;
  const col4Active = groupSlug === "gayrimenkul" && konutFlow && konutTxn !== "" && !leafParsed;

  const col2NeedsHighlightActive =
    groupSlug === "gayrimenkul" && konutFlow && konutTxn === "" && !leafParsed;

  return (
    <div className="category-miller">
      <div className="category-miller__head">
        <h2 className="category-miller__title">Adım adım kategori seç</h2>
        <p className="category-miller__crumb" aria-live="polite">
          {crumbText}
        </p>
      </div>
      <div className="category-miller__columns" role="group" aria-label="Kategori sütunları">
        <div className="category-miller__col">
          <ul className="category-miller__list" role="listbox" aria-label="Ana kategoriler">
            {CATEGORY_GROUPS.map((group) => {
              const sel = groupSlug === group.slug;
              return (
                <li key={group.slug} className="category-miller__item">
                  <button
                    type="button"
                    disabled={disabled}
                    role="option"
                    aria-selected={sel}
                    className={
                      sel
                        ? "category-miller__row category-miller__row--selected"
                        : "category-miller__row"
                    }
                    onClick={() => onPickGroup(group.slug)}
                  >
                    <span className="category-miller__row-label">
                      <span aria-hidden>{group.emoji}</span>{" "}
                      <span>{group.name}</span>
                    </span>
                    {sel && (
                      <span className="category-miller__chevron" aria-hidden>
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={
            !groupSlug
              ? "category-miller__col"
              : groupSlug === "gayrimenkul" &&
                  (konutFlow
                    ? col2NeedsHighlightActive ||
                      detailCategoryKey === GAYRIMENKUL_KONUT_DRAFT_KEY ||
                      !!leafParsed
                    : detailCategoryKey === "")
                ? "category-miller__col category-miller__col--active"
              : groupSlug !== "gayrimenkul" && !detailCategoryKey
                ? "category-miller__col category-miller__col--active"
                : "category-miller__col"
          }
        >
          {!groupSlug ? (
            <p className="category-miller__placeholder">
              Önce soldan ana kategori seçin.
            </p>
          ) : (
            <ul
              className="category-miller__list"
              role="listbox"
              aria-label={`${selectedGroup?.name ?? ""} alt kategorileri`}
            >
              {(selectedGroup?.subs ?? []).map((sub) => {
                const keyLeaf = compositeCategoryKey(selectedGroup!.slug, sub.slug);

                let rowSelected =
                  detailCategoryKey !== "" &&
                  detailCategoryKey === keyLeaf &&
                  !sub.drilldown;

                if (sub.drilldown === "konut") {
                  rowSelected =
                    konutFlow ||
                    Boolean(leafParsed) ||
                    detailCategoryKey === GAYRIMENKUL_KONUT_DRAFT_KEY;
                }

                const showDraftChevron =
                  sub.drilldown === "konut" && (konutFlow || !!leafParsed);
                const showLeafTick =
                  !sub.drilldown && detailCategoryKey === keyLeaf && keyLeaf !== "";
                const showKonutDoneTick = sub.drilldown === "konut" && !!leafParsed;

                return (
                  <li key={sub.slug} className="category-miller__item">
                    <button
                      type="button"
                      disabled={disabled}
                      role="option"
                      aria-selected={rowSelected}
                      className={
                        rowSelected
                          ? "category-miller__row category-miller__row--selected"
                          : "category-miller__row"
                      }
                      onClick={() => onPickLeafSub(selectedGroup!, sub)}
                    >
                      <span className="category-miller__row-label">{sub.name}</span>
                      {showDraftChevron && !showKonutDoneTick && (
                        <span className="category-miller__chevron" aria-hidden>
                          ›
                        </span>
                      )}
                      {(showLeafTick || showKonutDoneTick) && (
                        <span className="category-miller__ok" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {groupSlug === "gayrimenkul" && konutFlow && (
          <>
            <div
              className={
                col3Active
                  ? "category-miller__col category-miller__col--active"
                  : "category-miller__col"
              }
            >
              <ul className="category-miller__list" role="listbox" aria-label="İşlem tipi">
                {KONUT_LISTING_KINDS.map((k) => {
                  const selViaLeaf = leafParsed?.txn === k.slug;
                  const selDraft = konutTxn === k.slug && !leafParsed;
                  const sel = selViaLeaf || selDraft;
                  return (
                    <li key={k.slug} className="category-miller__item">
                      <button
                        type="button"
                        disabled={disabled}
                        role="option"
                        aria-selected={Boolean(sel)}
                        className={
                          sel
                            ? "category-miller__row category-miller__row--selected"
                            : "category-miller__row"
                        }
                        onClick={() => setKonutTxn(k.slug)}
                      >
                        <span className="category-miller__row-label">{k.name}</span>
                        {selViaLeaf && (
                          <span className="category-miller__ok" aria-hidden>
                            ✓
                          </span>
                        )}
                        {!leafParsed && selDraft && konutTxn && (
                          <span className="category-miller__chevron" aria-hidden>
                            ›
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {(konutTxn !== "" || leafParsed) &&
            (leafParsed?.txn || konutTxn) &&
            KONUT_LISTING_KINDS.some(
              (x) => x.slug === (leafParsed?.txn ?? konutTxn)
            ) ? (
              <div
                className={
                  col4Active || leafParsed
                    ? leafParsed
                      ? "category-miller__col"
                      : "category-miller__col category-miller__col--active"
                    : "category-miller__col category-miller__col--active"
                }
              >
                <ul className="category-miller__list" role="listbox" aria-label="Konut tipi">
                  {KONUT_PROPERTY_TYPES.map((p) => {
                    const txnNow = leafParsed?.txn ?? konutTxn;
                    const slugFull = konutLeafCategorySubSlug(
                      txnNow as (typeof KONUT_LISTING_KINDS)[number]["slug"],
                      p.slug
                    );
                    const leafKey = compositeCategoryKey("gayrimenkul", slugFull);
                    const sel = detailCategoryKey === leafKey;
                    return (
                      <li key={p.slug} className="category-miller__item">
                        <button
                          type="button"
                          disabled={disabled}
                          role="option"
                          aria-selected={sel}
                          className={
                            sel
                              ? "category-miller__row category-miller__row--selected"
                              : "category-miller__row"
                          }
                          onClick={() => onCategoryKeyChange(leafKey)}
                        >
                          <span className="category-miller__row-label">{p.name}</span>
                          {sel && (
                            <span className="category-miller__ok" aria-hidden>
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
      <p className="category-miller__hint meta">
        Emlak › Konut: önce Satılık veya Kiralık, sonra konut tipini seçin (Daire, Villa…).
      </p>
    </div>
  );
}
