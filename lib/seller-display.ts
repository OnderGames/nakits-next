/**
 * İlanlarda satıcı adı gösterimi: boşluk düzeni, Türkçe baş harf (e-posta dokunulmaz).
 */
export function formatSellerNameForDisplay(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return t;
  if (t.includes("@")) return t;
  return t
    .split(" ")
    .map((word) => {
      if (!word) return word;
      const lower = word.toLocaleLowerCase("tr-TR");
      return (
        lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1)
      );
    })
    .join(" ");
}
