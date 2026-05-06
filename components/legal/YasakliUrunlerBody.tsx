import Link from "next/link";

export default function YasakliUrunlerBody() {
  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Yasaklı ürün ve içerikler
      </h1>
      <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
        Son güncelleme: 6 Mayıs 2026
      </p>
      <p style={{ marginTop: 16, marginBottom: 0 }}>
        Nakits.com yalnızca yürürlükteki mevzuata ve platform kurallarına uygun ilanların
        yayınlanmasına izin verir. Aşağıdaki liste örneklendirici olup eksiksiz bir hukuki liste
        değildir; şüphe durumunda{" "}
        <Link href="/uyelik-sozlesmesi" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          üyelik sözleşmesi ve kullanım şartları
        </Link>{" "}
        ile{" "}
        <Link href="/gizlilik-politikasi" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          gizlilik politikası
        </Link>{" "}
        geçerlidir.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Kesinlikle yasak örnekler</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            Sahte, taklit, kaçak veya yasal olmayan ürünler; telif ve marka ihlali oluşturan içerikler.
          </li>
          <li style={{ marginBottom: 8 }}>
            Silah, mühimmat, patlayıcı madde ve benzeri güvenlik riski taşıyan ürünler.
          </li>
          <li style={{ marginBottom: 8 }}>Uyuşturucu veya yasal olmayan madde ilanları.</li>
          <li style={{ marginBottom: 8 }}>
            Tütün, alkol, kumar veya reşit olmayanlara yönelik sakıncalı içerikler (mevzuata aykırı
            biçimde).
          </li>
          <li style={{ marginBottom: 8 }}>Pornografik veya yasa dışı cinsel içerik.</li>
          <li style={{ marginBottom: 8 }}>
            İnsan veya hayvan ticareti, organ, kaçak göç ve benzeri yasa dışı faaliyetlere zemin
            oluşturan ilanlar.
          </li>
          <li style={{ marginBottom: 8 }}>
            Dolandırıcılık, kimlik avı veya kullanıcıları yanıltmaya yönelik içerikler.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Moderasyon</h2>
        <p>
          Platform, güvenlik ve yasal uyum için ilanları inceleyebilir, yayını durdurabilir veya
          üyeliği sonlandırabilir. Bu sayfa hukuki danışmanlık yerine geçmez.
        </p>
      </section>
    </>
  );
}
