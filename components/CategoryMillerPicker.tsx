"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_GROUPS,
  GAYRIMENKUL_KONUT_INTERMEDIATE_KEY,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  compositeCategoryKey,
  konutLeafCategorySubSlug,
  labelGayrimenkulSatKirLeaf,
  labelKonutLeafCategory,
  tryParseGayrimenkulSatKirLeafSubSlug,
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

/** @deprecated isim uyumu için — `isIntermediateGayrimenkulListingKey` kullanın */
export const GAYRIMENKUL_KONUT_DRAFT_KEY = GAYRIMENKUL_KONUT_INTERMEDIATE_KEY;

export default function CategoryMillerPicker({
  groupSlug,
  detailCategoryKey,
  onGroupChange,
  onCategoryKeyChange,
  disabled = false
}: CategoryMillerPickerProps) {
  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

  const [konutFlow, setKonutFlow] = useState(false);
  const [satKirFlowBase, setSatKirFlowBase] = useState<string | null>(null);
  const [txnDraft, setTxnDraft] = useState<
    (typeof KONUT_LISTING_KINDS)[number]["slug"] | ""
  >("");

  useEffect(() => {
    if (!detailCategoryKey.trim()) {
      return;
    }
    if (!detailCategoryKey.startsWith("gayrimenkul.")) {
      setKonutFlow(false);
      setSatKirFlowBase(null);
      setTxnDraft("");
      return;
    }
    const rest = detailCategoryKey.slice("gayrimenkul.".length);

    const kLeaf = tryParseKonutLeafSubSlug(rest);
    if (kLeaf) {
      setKonutFlow(true);
      setSatKirFlowBase(null);
      setTxnDraft(kLeaf.txn);
      return;
    }

    const sLeaf = tryParseGayrimenkulSatKirLeafSubSlug(rest);
    if (sLeaf) {
      setKonutFlow(false);
      setSatKirFlowBase(sLeaf.baseSlug);
      setTxnDraft(sLeaf.txn);
      return;
    }

    if (rest === "konut") {
      setKonutFlow(true);
      setSatKirFlowBase(null);
      setTxnDraft("");
      return;
    }

    const gm = CATEGORY_GROUPS.find((g) => g.slug === "gayrimenkul");
    const mid = gm?.subs.find((s) => s.slug === rest && s.drilldown);
    if (mid?.drilldown === "emlak-listing-kind") {
      setKonutFlow(false);
      setSatKirFlowBase(rest);
      setTxnDraft("");
      return;
    }

    setKonutFlow(false);
    setSatKirFlowBase(null);
    setTxnDraft("");
  }, [detailCategoryKey]);

  const konutLeafParsed = detailCategoryKey.startsWith("gayrimenkul.")
    ? tryParseKonutLeafSubSlug(detailCategoryKey.slice("gayrimenkul.".length))
    : null;

  const satKirLeafParsed = detailCategoryKey.startsWith("gayrimenkul.")
    ? tryParseGayrimenkulSatKirLeafSubSlug(
        detailCategoryKey.slice("gayrimenkul.".length)
      )
    : null;

  const crumbText = useMemo(() => {
    if (!selectedGroup) return "Kategori seçin";
    const gmSlug = selectedGroup.slug;
    if (!detailCategoryKey.trim()) {
      if (konutFlow) return `${selectedGroup.name} › Konut`;
      if (satKirFlowBase) {
        const lbl = selectedGroup.subs.find((s) => s.slug === satKirFlowBase)
          ?.name;
        return lbl
          ? `${selectedGroup.name} › ${lbl}`
          : `${selectedGroup.name}`;
      }
      return `${selectedGroup.name}`;
    }
    if (!detailCategoryKey.startsWith(`${gmSlug}.`)) {
      return `${selectedGroup.name}`;
    }
    const subPart = detailCategoryKey.slice(gmSlug.length + 1);

    if (konutLeafParsed) {
      return `${selectedGroup.name} › ${labelKonutLeafCategory(konutLeafParsed.txn, konutLeafParsed.prop)}`;
    }
    if (satKirLeafParsed) {
      return `${selectedGroup.name} › ${labelGayrimenkulSatKirLeaf(satKirLeafParsed.baseLabel, satKirLeafParsed.txn)}`;
    }

    if (detailCategoryKey === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY && txnDraft) {
      const t = KONUT_LISTING_KINDS.find((k) => k.slug === txnDraft)?.name;
      return t ? `${selectedGroup.name} › Konut › ${t}` : `${selectedGroup.name} › Konut`;
    }
    if (
      detailCategoryKey === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY ||
      subPart === "konut"
    ) {
      return `${selectedGroup.name} › Konut`;
    }

    const legacySub = selectedGroup.subs.find((s) => s.slug === subPart);
    if (legacySub) return `${selectedGroup.name} › ${legacySub.name}`;

    return `${selectedGroup.name}`;
  }, [
    detailCategoryKey,
    konutFlow,
    konutLeafParsed,
    satKirFlowBase,
    satKirLeafParsed,
    selectedGroup,
    txnDraft
  ]);

  function resetDrills() {
    setKonutFlow(false);
    setSatKirFlowBase(null);
    setTxnDraft("");
  }

  function onPickGroup(slug: string) {
    onGroupChange(slug);
    onCategoryKeyChange("");
    resetDrills();
  }

  function onPickLeafSub(group: CategoryGroupDef, sub: SubcategoryDef) {
    if (group.slug !== "gayrimenkul") {
      resetDrills();
      onCategoryKeyChange(compositeCategoryKey(group.slug, sub.slug));
      return;
    }
    if (sub.drilldown === "konut") {
      setKonutFlow(true);
      setSatKirFlowBase(null);
      setTxnDraft("");
      onCategoryKeyChange(GAYRIMENKUL_KONUT_INTERMEDIATE_KEY);
      return;
    }
    if (sub.drilldown === "emlak-listing-kind") {
      setKonutFlow(false);
      setSatKirFlowBase(sub.slug);
      setTxnDraft("");
      onCategoryKeyChange(compositeCategoryKey("gayrimenkul", sub.slug));
      return;
    }
    resetDrills();
    onCategoryKeyChange(compositeCategoryKey(group.slug, sub.slug));
  }

  const showSatKirColumn =
    groupSlug === "gayrimenkul" &&
    Boolean(konutFlow || satKirFlowBase || konutLeafParsed || satKirLeafParsed);

  const col3SatKirForEmlak =
    Boolean(satKirFlowBase) && !konutFlow && !satKirLeafParsed;

  const col3ActiveKonutDraft =
    konutFlow && txnDraft === "" && !konutLeafParsed && detailCategoryKey === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY;

  const col3ActiveKonutTxnPicked =
    konutFlow && txnDraft !== "" && !konutLeafParsed;

  const col3ActiveSatKir = col3SatKirForEmlak && txnDraft === "";

  const showKonutPropColumn =
    konutFlow && txnDraft !== "" && !konutLeafParsed;

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
            groupSlug &&
            ((!detailCategoryKey && groupSlug !== "gayrimenkul") ||
              (groupSlug === "gayrimenkul" &&
                !satKirFlowBase &&
                !konutFlow &&
                !konutLeafParsed &&
                !satKirLeafParsed &&
                detailCategoryKey === "") ||
              (groupSlug === "gayrimenkul" &&
                satKirFlowBase &&
                detailCategoryKey === ""))
              ? "category-miller__col category-miller__col--active"
              : groupSlug &&
                  groupSlug !== "gayrimenkul" &&
                  !detailCategoryKey
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
                let rowSel = Boolean(
                  detailCategoryKey &&
                    detailCategoryKey === keyLeaf &&
                    !sub.drilldown
                );

                if (sub.drilldown === "konut") {
                  rowSel =
                    konutFlow ||
                    Boolean(konutLeafParsed) ||
                    detailCategoryKey === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY;
                } else if (sub.drilldown === "emlak-listing-kind") {
                  rowSel =
                    Boolean(satKirFlowBase === sub.slug) ||
                    Boolean(
                      detailCategoryKey.startsWith(`${selectedGroup!.slug}.${sub.slug}-`)
                    );
                }

                const showChevronKonut =
                  sub.drilldown === "konut" &&
                  (konutFlow || konutLeafParsed) &&
                  !konutLeafParsed;
                const showChevronSatKir =
                  sub.drilldown === "emlak-listing-kind" &&
                  (satKirFlowBase === sub.slug || rowSel) &&
                  !satKirLeafParsed;

                return (
                  <li key={sub.slug} className="category-miller__item">
                    <button
                      type="button"
                      disabled={disabled}
                      role="option"
                      aria-selected={rowSel}
                      className={
                        rowSel
                          ? "category-miller__row category-miller__row--selected"
                          : "category-miller__row"
                      }
                      onClick={() => onPickLeafSub(selectedGroup!, sub)}
                    >
                      <span className="category-miller__row-label">{sub.name}</span>
                      {showChevronKonut && (
                        <span className="category-miller__chevron" aria-hidden>
                          ›
                        </span>
                      )}
                      {showChevronSatKir && !satKirLeafParsed && (
                        <span className="category-miller__chevron" aria-hidden>
                          ›
                        </span>
                      )}
                      {konutLeafParsed && sub.drilldown === "konut" && (
                        <span className="category-miller__ok" aria-hidden>
                          ✓
                        </span>
                      )}
                      {satKirLeafParsed &&
                        sub.drilldown === "emlak-listing-kind" &&
                        satKirLeafParsed.baseSlug === sub.slug && (
                          <span className="category-miller__ok" aria-hidden>
                            ✓
                          </span>
                        )}
                      {!sub.drilldown &&
                        detailCategoryKey === keyLeaf &&
                        keyLeaf !== "" && (
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

        {showSatKirColumn && (
          <div
            className={
              col3ActiveKonutDraft ||
              col3ActiveKonutTxnPicked ||
              col3ActiveSatKir
                ? "category-miller__col category-miller__col--active"
                : "category-miller__col"
            }
          >
            <ul className="category-miller__list" role="listbox" aria-label="İşlem tipi">
              {KONUT_LISTING_KINDS.map((k) => {
                const selLeafKonut =
                  konutLeafParsed?.txn === k.slug ||
                  satKirLeafParsed?.txn === k.slug;
                const selDraft =
                  txnDraft === k.slug && !konutLeafParsed && !satKirLeafParsed;
                const sel = selLeafKonut || selDraft;

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
                      onClick={() => {
                        if (col3SatKirForEmlak && satKirFlowBase) {
                          onCategoryKeyChange(
                            compositeCategoryKey(
                              "gayrimenkul",
                              `${satKirFlowBase}-${k.slug}`
                            )
                          );
                          return;
                        }
                        if (konutFlow) {
                          setTxnDraft(k.slug);
                        }
                      }}
                    >
                      <span className="category-miller__row-label">{k.name}</span>
                      {selLeafKonut && (
                        <span className="category-miller__ok" aria-hidden>
                          ✓
                        </span>
                      )}
                      {konutFlow &&
                        selDraft &&
                        !konutLeafParsed &&
                        txnDraft && (
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
        )}

        {showKonutPropColumn && (
          <div className="category-miller__col category-miller__col--active">
            <ul className="category-miller__list" role="listbox" aria-label="Konut tipi">
              {KONUT_PROPERTY_TYPES.map((p) => {
                const slugFull = konutLeafCategorySubSlug(
                  txnDraft as (typeof KONUT_LISTING_KINDS)[number]["slug"],
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
        )}
      </div>
      <p className="category-miller__hint meta">
        Emlak ilanlarında önce alan türünü (Konut, İş yeri, Arsa…), ardından Satılık veya
        Kiralık seçin; Konut’ta bir de konut tipi (Daire, Villa…) gelir.
      </p>
    </div>
  );
}
