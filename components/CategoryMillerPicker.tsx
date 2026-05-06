"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_GROUPS,
  GAYRIMENKUL_KONUT_INTERMEDIATE_KEY,
  KONUT_LISTING_KINDS,
  KONUT_PROPERTY_TYPES,
  OTOMOBIL_MARKALARI,
  TASITLAR_OTOMOBIL_INTERMEDIATE_KEY,
  compositeCategoryKey,
  getOtomobilModelsForBrand,
  getTasitlarOtomobilBrandSlugAwaitingModel,
  isTasitlarOtomobilFinalListingKey,
  tryParseOtomobilBrandIntermediateSubSlug,
  tryParseOtomobilBrandOnlyLeafSubSlug,
  konutLeafCategorySubSlug,
  labelGayrimenkulSatKirLeaf,
  labelKonutLeafCategory,
  tryParseGayrimenkulSatKirLeafSubSlug,
  tryParseKonutLeafSubSlug,
  tryParseOtomobilModelLeafSubSlug,
  type CategoryGroupDef,
  type SubcategoryDef
} from "@/lib/categories";

export type CategoryMillerPickerProps = {
  groupSlug: string;
  detailCategoryKey: string;
  onGroupChange: (slug: string) => void;
  onCategoryKeyChange: (key: string) => void;
  disabled?: boolean;
  /** Ana kategori üst bileşende seçildiyse sol sütun gizlenir */
  hideMainGroupColumn?: boolean;
  /** Sol üst: ana kategori seçimine dön */
  onRequestChangeMainCategory?: () => void;
};

/** @deprecated isim uyumu için — `isIntermediateGayrimenkulListingKey` kullanın */
export const GAYRIMENKUL_KONUT_DRAFT_KEY = GAYRIMENKUL_KONUT_INTERMEDIATE_KEY;

function displayOtomobilModelLabel(name: string): string {
  const i = name.lastIndexOf("›");
  return i === -1 ? name : name.slice(i + 1).trim();
}

export default function CategoryMillerPicker({
  groupSlug,
  detailCategoryKey,
  onGroupChange,
  onCategoryKeyChange,
  disabled = false,
  hideMainGroupColumn = false,
  onRequestChangeMainCategory
}: CategoryMillerPickerProps) {
  const selectedGroup = CATEGORY_GROUPS.find((g) => g.slug === groupSlug);

  const [konutFlow, setKonutFlow] = useState(false);
  const [satKirFlowBase, setSatKirFlowBase] = useState<string | null>(null);
  const [txnDraft, setTxnDraft] = useState<
    (typeof KONUT_LISTING_KINDS)[number]["slug"] | ""
  >("");

  const columnsScrollerRef = useRef<HTMLDivElement>(null);

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

    if (gmSlug === "tasitlar") {
      const model = tryParseOtomobilModelLeafSubSlug(subPart);
      if (model) {
        return `${selectedGroup.name} › Otomobil › ${model.brandName} › ${model.modelName}`;
      }
      const brandOnly = tryParseOtomobilBrandOnlyLeafSubSlug(subPart);
      if (brandOnly) {
        return `${selectedGroup.name} › Otomobil › ${brandOnly.brandName}`;
      }
      const brandMid = tryParseOtomobilBrandIntermediateSubSlug(subPart);
      if (brandMid) {
        return `${selectedGroup.name} › Otomobil › ${brandMid.brandName}`;
      }
      if (subPart === "otomobil") {
        return `${selectedGroup.name} › Otomobil`;
      }
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

  const showOtomobilMarkaColumn =
    groupSlug === "tasitlar" &&
    (detailCategoryKey === TASITLAR_OTOMOBIL_INTERMEDIATE_KEY ||
      detailCategoryKey.startsWith("tasitlar.otomobil-"));

  const brandSlugAwaitingModel =
    groupSlug === "tasitlar"
      ? getTasitlarOtomobilBrandSlugAwaitingModel(detailCategoryKey)
      : null;

  const showOtomobilModelColumn = Boolean(brandSlugAwaitingModel);

  /** Mobil: çoklu sütun taşinca son (aktif) sütunu yatayda görünür kılar */
  useLayoutEffect(() => {
    const strip = columnsScrollerRef.current;
    if (!strip) return;

    const scrollLastColumnIntoView = (): void => {
      if (strip.scrollWidth <= strip.clientWidth + 8) return;
      const cols = strip.querySelectorAll(".category-miller__col");
      const last = cols.item(cols.length - 1);
      if (!(last instanceof HTMLElement)) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      last.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "nearest",
        inline: "end"
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollLastColumnIntoView);
    });
  }, [
    detailCategoryKey,
    groupSlug,
    hideMainGroupColumn,
    txnDraft,
    konutFlow,
    satKirFlowBase,
    showSatKirColumn,
    showKonutPropColumn,
    showOtomobilMarkaColumn,
    showOtomobilModelColumn
  ]);

  function renderSecondColumnSubRow(sub: SubcategoryDef) {
    if (!selectedGroup) return null;
    const keyLeaf = compositeCategoryKey(selectedGroup.slug, sub.slug);
    let rowSel = Boolean(
      detailCategoryKey && detailCategoryKey === keyLeaf && !sub.drilldown
    );

    if (sub.drilldown === "otomobil-marka") {
      rowSel =
        detailCategoryKey === TASITLAR_OTOMOBIL_INTERMEDIATE_KEY ||
        (detailCategoryKey.startsWith("tasitlar.otomobil-") &&
          detailCategoryKey !== "tasitlar.otomobil");
    }

    if (sub.drilldown === "konut") {
      rowSel =
        konutFlow ||
        Boolean(konutLeafParsed) ||
        detailCategoryKey === GAYRIMENKUL_KONUT_INTERMEDIATE_KEY;
    } else if (sub.drilldown === "emlak-listing-kind") {
      rowSel =
        Boolean(satKirFlowBase === sub.slug) ||
        Boolean(
          detailCategoryKey.startsWith(`${selectedGroup.slug}.${sub.slug}-`)
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

    const showChevronOtomobil =
      sub.drilldown === "otomobil-marka" &&
      rowSel &&
      !isTasitlarOtomobilFinalListingKey(detailCategoryKey);

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
          onClick={() => onPickLeafSub(selectedGroup, sub)}
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
          {showChevronOtomobil && (
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
          {isTasitlarOtomobilFinalListingKey(detailCategoryKey) &&
            sub.drilldown === "otomobil-marka" && (
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
  }

  const rootClass =
    "category-miller" +
    (hideMainGroupColumn ? " category-miller--no-main" : "");

  return (
    <div className={rootClass}>
      <div className="category-miller__head">
        {hideMainGroupColumn && onRequestChangeMainCategory ? (
          <button
            type="button"
            className="category-miller__back-main"
            disabled={disabled}
            onClick={() => onRequestChangeMainCategory()}
          >
            ← Ana kategori
          </button>
        ) : null}
        <h2 className="category-miller__title">
          {hideMainGroupColumn ? "Alt türü seç" : "Adım adım kategori seç"}
        </h2>
        <p className="category-miller__crumb" aria-live="polite">
          {hideMainGroupColumn && selectedGroup ? (
            <>
              <span aria-hidden>{selectedGroup.emoji}</span>{" "}
            </>
          ) : null}
          {crumbText}
        </p>
      </div>
      <div
        ref={columnsScrollerRef}
        className="category-miller__columns"
        role="group"
        aria-label="Kategori sütunları"
      >
        {!hideMainGroupColumn ? (
          <div className="category-miller__col">
            <ul
              className="category-miller__list"
              role="listbox"
              aria-label="Ana kategoriler"
            >
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
        ) : null}

        <div
          className={
            groupSlug &&
            ((!detailCategoryKey && groupSlug !== "gayrimenkul") ||
              (groupSlug === "tasitlar" &&
                Boolean(detailCategoryKey?.startsWith("tasitlar."))) ||
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
                  groupSlug !== "tasitlar" &&
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
              {groupSlug === "tasitlar" && selectedGroup ? (
                <>
                  {selectedGroup.subs
                    .filter((s) => s.slug === "otomobil")
                    .map((sub) => renderSecondColumnSubRow(sub))}
                  <li
                    className="category-miller__section-label"
                    role="presentation"
                  >
                    <span className="category-miller__section-label-text">
                      Diğer vasıta türleri
                    </span>
                  </li>
                  {selectedGroup.subs
                    .filter((s) => s.slug !== "otomobil")
                    .map((sub) => renderSecondColumnSubRow(sub))}
                </>
              ) : (
                (selectedGroup?.subs ?? []).map((sub) =>
                  renderSecondColumnSubRow(sub)
                )
              )}
            </ul>
          )}
        </div>

        {showOtomobilMarkaColumn && (
          <div className="category-miller__col category-miller__col--active">
            <ul
              className="category-miller__list"
              role="listbox"
              aria-label="Otomobil markası"
            >
              {OTOMOBIL_MARKALARI.map((m) => {
                const intermediateKey = compositeCategoryKey(
                  "tasitlar",
                  `otomobil-${m.slug}`
                );
                const models = getOtomobilModelsForBrand(m.slug);
                const rest = detailCategoryKey.startsWith("tasitlar.")
                  ? detailCategoryKey.slice("tasitlar.".length)
                  : "";
                const modelLeaf = rest
                  ? tryParseOtomobilModelLeafSubSlug(rest)
                  : null;
                const modelPickedHere =
                  modelLeaf?.brandSlug === m.slug;
                const sel = models?.length
                  ? detailCategoryKey === intermediateKey || modelPickedHere
                  : detailCategoryKey === intermediateKey;
                const showChevronBrand =
                  Boolean(models?.length) && sel && !modelPickedHere;
                const showOkBrand =
                  (models?.length && modelPickedHere) ||
                  (!models?.length && detailCategoryKey === intermediateKey);
                return (
                  <li key={m.slug} className="category-miller__item">
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
                      onClick={() => onCategoryKeyChange(intermediateKey)}
                    >
                      <span className="category-miller__row-label">{m.name}</span>
                      {showChevronBrand && (
                        <span className="category-miller__chevron" aria-hidden>
                          ›
                        </span>
                      )}
                      {showOkBrand && (
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

        {showOtomobilModelColumn && brandSlugAwaitingModel ? (
          <div className="category-miller__col category-miller__col--active">
            <ul
              className="category-miller__list"
              role="listbox"
              aria-label="Otomobil modeli"
            >
              {(getOtomobilModelsForBrand(brandSlugAwaitingModel) ?? []).map(
                (mod) => {
                  const leafKey = compositeCategoryKey(
                    "tasitlar",
                    `otomobil-${brandSlugAwaitingModel}-${mod.slug}`
                  );
                  const sel = detailCategoryKey === leafKey;
                  return (
                    <li key={mod.slug} className="category-miller__item">
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
                        <span className="category-miller__row-label">
                          {displayOtomobilModelLabel(mod.name)}
                        </span>
                        {sel && (
                          <span className="category-miller__ok" aria-hidden>
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  );
                }
              )}
            </ul>
          </div>
        ) : null}

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
      {groupSlug === "gayrimenkul" ? (
        <p className="category-miller__hint meta">
          Önce ilan konusu alanı (Konut, İş yeri, Arsa…), ardından satılık / kiralık;
          konutta son adımda yapı tipi seçilir.
        </p>
      ) : groupSlug === "tasitlar" ? (
        <p className="category-miller__hint meta">
          Otomobilde sırayla alt tür, marka ve model; bisiklet, motosiklet vb.
          tek seçimde biter.
        </p>
      ) : hideMainGroupColumn ? (
        <p className="category-miller__hint meta">
          Soldan sağa ilerleyin; tamamlanan satırda ✓ işareti çıkar — seçiminiz
          bittiğinde sonraki adıma otomatik geçilir.
        </p>
      ) : null}
    </div>
  );
}
