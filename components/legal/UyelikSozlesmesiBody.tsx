import Link from "next/link";

export default function UyelikSozlesmesiBody() {
  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Nakits.com Üyelik Sözleşmesi ve Kullanım Şartları
      </h1>
      <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
        Son güncelleme: 6 Mayıs 2026
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Taraflar</h2>
        <p>
          Bu sözleşme, Nakits.com internet sitesinin sahibi (bundan sonra
          “Nakits.com” olarak anılacaktır) ile siteye üye olan gerçek veya tüzel kişi
          (bundan sonra “Üye” olarak anılacaktır) arasında akdedilmiştir.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Konu</h2>
        <p>
          Sözleşmenin konusu, Nakits.com üzerinden sunulan hizmetlerden üyelerin
          yararlanma koşullarının ve tarafların hak ve yükümlülüklerinin belirlenmesidir.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>3. Üyelik Şartları</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            Üye, kayıt sırasında verdiği bilgilerin doğru ve güncel olduğunu kabul eder.
          </li>
          <li style={{ marginBottom: 8 }}>
            Üye, siteyi yalnızca yasal amaçlarla kullanacağını taahhüt eder.
          </li>
          <li style={{ marginBottom: 8 }}>18 yaşından küçük kişiler siteye üye olamaz.</li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, üyelik başvurularını reddetme veya iptal etme hakkına sahiptir.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>4. Üyelik ve Kullanım Kuralları</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            Üye, ilan verirken doğru, eksiksiz ve güncel bilgiler sunmakla yükümlüdür.
          </li>
          <li style={{ marginBottom: 8 }}>
            Üye, site üzerinden yaptığı işlemlerden doğacak hukuki ve mali sorumluluğu kabul eder.
          </li>
          <li style={{ marginBottom: 8 }}>
            Üye, siteyi üçüncü kişilerin haklarını ihlal edecek şekilde kullanamaz.
          </li>
          <li style={{ marginBottom: 8 }}>
            Yasaklı ürünlerin ilanı kesinlikle yasaktır. Yasaklı ürünler arasında; sahte, kaçak,
            yasal olmayan ürünler; silah, mühimmat, patlayıcı, uyuşturucu, tütün, alkol, kumar
            içerikleri, pornografi, telif hakkı ihlali içeren ürünler ve mevzuata aykırı diğer
            ürünler yer alır. Ayrıntılı liste için{" "}
            <Link
              href="/yasakli-urunler"
              style={{ color: "var(--primary)", textDecoration: "underline" }}
            >
              Yasaklı ürün ve içerikler
            </Link>{" "}
            sayfasına bakınız.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>5. Nakits.com Hakları ve Yükümlülükleri</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, üyelik şartlarını ve site kurallarını değiştirme hakkına sahiptir.
          </li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, üyelerin paylaştığı içerikleri denetleme ve gerektiğinde kaldırma
            hakkına sahiptir.
          </li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, üyelerin kişisel verilerini{" "}
            <Link
              href="/gizlilik-politikasi"
              style={{ color: "var(--primary)", textDecoration: "underline" }}
            >
              Gizlilik Politikası ve KVKK bildirimi
            </Link>{" "}
            çerçevesinde korur.
          </li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, sistemin güvenliğini sağlamak için gerekli teknik önlemleri alır.
          </li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, yalnızca ilan yayınlama hizmeti sunar; ürün/hizmetin doğruluğu, teslimi ve
            ödeme süreçlerinden satıcı sorumludur. Nakits.com bu işlemlere taraf değildir.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>6. Ücretlendirme ve Komisyon</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, belirli hizmetler için ücret veya komisyon talep edebilir.
          </li>
          <li style={{ marginBottom: 8 }}>Ücretlendirme politikası site üzerinde ayrıca duyurulur.</li>
          <li style={{ marginBottom: 8 }}>Üye, bu ücretlendirmeleri kabul ederek siteyi kullanır.</li>
          <li style={{ marginBottom: 8 }}>
            Ödeme ve iade koşulları ayrıca duyurulacak olup, Nakits.com yalnızca aracılık hizmeti
            sunduğundan ürün/hizmet bedellerinden sorumlu değildir.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>7. Sözleşmenin Feshi</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>Üye, istediği zaman üyeliğini sonlandırabilir.</li>
          <li style={{ marginBottom: 8 }}>
            Nakits.com, üyelik şartlarına aykırı davranan üyelerin üyeliğini tek taraflı olarak
            iptal edebilir.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>8. Uyuşmazlık Çözümü</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>Bu sözleşmeden doğacak uyuşmazlıklarda Türk Hukuku uygulanır.</li>
          <li style={{ marginBottom: 8 }}>Adana Mahkemeleri ve İcra Daireleri yetkilidir.</li>
          <li style={{ marginBottom: 8 }}>
            Taraflar, dava açmadan önce arabuluculuk yoluna başvurmayı kabul eder.
          </li>
        </ul>
      </section>

      <p style={{ marginTop: 24 }}>
        İngilizce metin:{" "}
        <Link href="/terms-of-service" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          Terms of Service
        </Link>
      </p>
    </>
  );
}
