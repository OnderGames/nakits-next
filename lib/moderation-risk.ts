/**
 * Moderasyon: üyelik sözleşmesindeki yasaklı ürün/hizmetlere işaret edebilecek
 * metin örüntüleri (tam otomatik hukuki karar değildir; önceliklendirme için).
 */

export type ModerationRiskMatch = {
  id: string;
  /** Kısa Türkçe etiket (moderasyon listesinde rozet) */
  label: string;
};

/**
 * Başlık + açıklamada aranır (Unicode bayraklı `iu`).
 * Çok genel tek kelimeler (ör. "bomba" günlük dilde) bilerek yok.
 */
const TEXT_MATCHERS: ModerationRiskMatch[] = [
  { id: "weapon_word", label: "Silah / ateşli silah ifadesi" },
  { id: "ammo", label: "Mühimmat / cephane" },
  { id: "explosive", label: "Patlayıcı" },
  { id: "drugs", label: "Uyuşturucu / uyarıcı madde" },
  { id: "gambling", label: "Kumar / bahis / casino" },
  { id: "tobacco_sales", label: "Tütün satışı (risk)" },
  { id: "alcohol_sales", label: "Alkol satışı (risk)" },
  { id: "adult", label: "Yetişkin içerik / escort (risk)" },
  { id: "counterfeit", label: "Sahte / çakma ürün" },
  { id: "illegal_trade", label: "Kaçak / yasadışı ticaret" }
];

const TEXT_REGEX: Record<ModerationRiskMatch["id"], RegExp> = {
  weapon_word:
    /\b(silah|tabanca|tüfek|tufek|av\s*tüfeği|av\s*tufegi|kurşun|kursun|nişangah|nisangah|kurmalı|kurmali)\b/iu,
  ammo: /\b(mühimmat|muhimmat|cephane|fişek|fisek|mermi|sarjör|sarjor)\b/iu,
  explosive: /\b(patlayıcı|patlayici|dinamit|tnt|c4|mayın|mayin)\b/iu,
  drugs:
    /\b(uyuşturucu|uyusturucu|eroin|kokain|esrar|skunk|metamfetamin|metanfetamin|captagon|sentetik\s*cannabinoid|bonzai|met\s*kafa)\b/iu,
  gambling:
    /\b(kumar(hane|hanesi)?|bahis\s*sitesi|iddaa\s*hesabı|iddaa\s*hesabi|casino\s*(online|sitesi)?|rulet\s*masası|rulet\s*masasi|poker\s*masası|poker\s*masasi|slot\s*makinesi|şans\s*oyunu|sans\s*oyunu)\b/iu,
  tobacco_sales:
    /\b(sigara\s*satis|sigara\s*satış|puro\s*satis|puro\s*satış|tütün\s*satis|tutun\s*satis|tütün\s*satış|vape\s*(sıvı|sivi|likit)|elektronik\s*sigara\s*satis|elektronik\s*sigara\s*satış)\b/iu,
  alcohol_sales:
    /\b(viski\s*satis|viski\s*satış|rakı\s*satis|raki\s*satis|rakı\s*satış|alkol\s*satis|alkol\s*satış|bira\s*koli|şarap\s*satis|sarap\s*satis)\b/iu,
  adult:
    /\b(porno(grafi)?|sex\s*satis|seks\s*hizmet|escort\s*hizmet|fahişe|fahise)\b/iu,
  counterfeit:
    /\b(sahte\s*(ürün|urun)?|çakma\s*(ürün|urun)?|replika\s*(saat|çanta|canta)|taklit\s*marka)\b/iu,
  illegal_trade:
    /\b(kaçak\s*(mal|telefon|sigara)|kacak\s*(mal|telefon|sigara)|yasadışı\s*yayın|yasadisi\s*yayin)\b/iu
};

/** İleride DB’de özel “riskli” alt kategori slug’ları eklenirse buraya prefix yazılır. */
const RISKY_CATEGORY_KEY_PREFIXES: readonly string[] = [
  // örn: "yasakli-test." — şimdilik boş
];

export type ModerationRiskScan = {
  risky: boolean;
  reasons: string[];
};

function normalizeCategoryKey(key: string): string {
  return key.trim().toLowerCase();
}

export function scanListingModerationRisk(input: {
  title: string;
  description: string | null | undefined;
  categoryKey: string;
}): ModerationRiskScan {
  const reasons: string[] = [];
  const haystack = `${input.title}\n${input.description ?? ""}`;

  for (const m of TEXT_MATCHERS) {
    const rx = TEXT_REGEX[m.id];
    if (rx?.test(haystack)) {
      reasons.push(m.label);
    }
  }

  const ck = normalizeCategoryKey(input.categoryKey);
  for (const p of RISKY_CATEGORY_KEY_PREFIXES) {
    const pref = p.toLowerCase();
    if (pref && ck.startsWith(pref)) {
      reasons.push(`Kategori ön eki: ${p}`);
    }
  }

  return {
    risky: reasons.length > 0,
    reasons
  };
}
