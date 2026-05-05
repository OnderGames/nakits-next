import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik politikası ve KVKK aydınlatma metni",
  description:
    "Nakits.com kişisel verilerin korunması, işlenme amaçları, haklarınız ve çerezler hakkında bilgilendirme."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link
          href="/"
          style={{ color: "var(--primary)", textDecoration: "underline" }}
        >
          ← Ana sayfaya dön
        </Link>
      </p>
      <article
        className="panel"
        style={{ maxWidth: 720, lineHeight: 1.65 }}
      >
        <h1 className="section-title" style={{ marginTop: 0 }}>
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          Son güncelleme: 6 Mayıs 2026
        </p>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Amaç ve Kapsam</h2>
          <p>
            Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
            uyarınca, Nakits.com ilan platformu (“Platform”) kapsamında
            kişisel verilerinizin nasıl işlendiği hakkında sizi aydınlatmak
            ve gizlilik uygulamalarımızı açıklamak amacıyla hazırlanmıştır.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Veri Sorumlusu</h2>
          <p>
            KVKK kapsamında veri sorumlusu, Nakits.com hizmetini işleten
            tüzel/gerçek kişi unvanıdır. İlgili kişi taleplerinizi kimliğinizi
            doğrulayacak bilgilerle birlikte, Platform üzerinde yayımlanan
            resmi iletişim kanalları aracılığıyla iletebilirsiniz. İletişim
            bilgileri güncellendiğinde bu sayfa üzerinden duyurulur.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            3. İşlenen Kişisel Veri Kategorileri
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Kimlik ve iletişim:</strong> ad-soyad veya mağaza
              unvanı, e-posta adresi, telefon numarası; profil veya ilan
              içeriğinde paylaştığınız diğer bilgiler.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Hesap ve işlem:</strong> üyelik bilgileri, ilan
              metinleri ve görselleri, favoriler, mesajlaşma içeriği,
              moderasyon ve destek kayıtları.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Teknik ve kullanım:</strong> IP adresi, cihaz ve tarayıcı
              bilgisi, oturum ve güvenlik logları, çerezler ve benzeri
              teknolojilerle toplanan veriler.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            4. Kişisel Verilerin İşlenme Amaçları
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Üyelik oluşturma, kimlik doğrulama ve hesabınızı yönetme.
            </li>
            <li style={{ marginBottom: 8 }}>
              İlanların yayınlanması, arama ve vitrin hizmetlerinin sunulması.
            </li>
            <li style={{ marginBottom: 8 }}>
              Alıcı ve satıcılar arasında Platform üzerinden iletişimin
              sağlanması.
            </li>
            <li style={{ marginBottom: 8 }}>
              Güvenlik, dolandırıcılık ve kötüye kullanımın önlenmesi; hukuki
              yükümlülüklerin yerine getirilmesi.
            </li>
            <li style={{ marginBottom: 8 }}>
              Hizmet kalitesini artırma, hata giderme ve istatistiksel analiz
              (mümkün olduğunca anonimleştirilmiş veya toplulaştırılmış
              verilerle).
            </li>
            <li style={{ marginBottom: 8 }}>
              Yasal mercilere bilgi verilmesi ve hak taleplerinin savunulması.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>5. Hukuki Sebepler</h2>
          <p>
            Verileriniz; KVKK’nın 5. ve 6. maddelerinde öngörülen; açık rıza,
            sözleşmenin kurulması veya ifası, veri sorumlusunun meşru menfaati,
            hukuki yükümlülüğün yerine getirilmesi veya kanunda açıkça
            öngörülmesi gibi hukuki gereklere dayanarak işlenir. İlgili işlem
            için hangi sebebin geçerli olduğu duruma göre değişebilir.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>6. Aktarım</h2>
          <p>
            Platform’un barındırılması ve veri tabanı işlemleri için hizmet
            sağlayıcılar (örneğin bulut/hosting ve kimlik doğrulama sağlayıcısı)
            kullanılabilir. Bu çerçevede verileriniz, hizmetin gerektirdiği
            ölçüde ve sözleşmesel güvenceler dahilinde yurt içinde veya
            KVKK’ya uygun şekilde yurt dışına aktarılabilir. Kamu kurumlarına
            yasal zorunluluk halinde aktarım yapılabilir.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>7. Saklama Süreleri</h2>
          <p>
            Kişisel veriler, işlendikleri amaçla bağlantılı olarak gerekli süre
            boyunca saklanır. Hesap ve ilan verileriniz aktif kullanım veya
            yasal zamanaşımı / denetim gereklilikleri sona erdiğinde silinir,
            yok edilir veya anonim hale getirilir; süreler ilgili mevzuat ve
            operasyonel ihtiyaçlara göre belirlenir.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. KVKK Kapsamındaki Haklarınız
          </h2>
          <p style={{ marginBottom: 12 }}>
            İlgili kişi olarak KVKK’nın 11. maddesi uyarınca:
          </p>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Kişisel verilerinizin işlenip işlenmediğini öğrenme,
            </li>
            <li style={{ marginBottom: 8 }}>
              İşlenmişse bilgi talep etme ve amacına uygun kullanılıp
              kullanılmadığını öğrenme,
            </li>
            <li style={{ marginBottom: 8 }}>
              Aktarıldığı üçüncü kişileri bilme (varsa),
            </li>
            <li style={{ marginBottom: 8 }}>
              Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme,
            </li>
            <li style={{ marginBottom: 8 }}>
              Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok
              edilmesini isteme,
            </li>
            <li style={{ marginBottom: 8 }}>
              Aktarılan üçüncü kişilere yukarıdaki işlemlerin bildirilmesini
              isteme,
            </li>
            <li style={{ marginBottom: 8 }}>
              Münhasıran otomatik sistemler ile analizi sonucu aleyhinize bir
              sonucun çıkmasına itiraz etme,
            </li>
            <li style={{ marginBottom: 8 }}>
              Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın
              giderilmesini talep etme,
            </li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            haklarına sahipsiniz. Taleplerinizi veri sorumlusuna
            iletebilirsiniz. Başvurunuza kanuni süre içinde yanıt verilir.
            Sonuçtan memnun kalmamanız hâlinde Kişisel Verileri Koruma
            Kurulu’na şikâyette bulunabilirsiniz (
            <a
              href="https://www.kvkk.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)" }}
            >
              kvkk.gov.tr
            </a>
            ).
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>9. Güvenlik</h2>
          <p>
            Kişisel verilerinizin gizliliği ve bütünlüğü için uygun teknik ve
            idari tedbirler alınır. İnternet ortamında hiçbir iletimin %100
            güvenli olmadığını hatırlatırız; güçlü parola kullanmanız ve hesap
            bilgilerinizi paylaşmamanız önemlidir.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>10. Çerezler</h2>
          <p>
            Oturumunuzun ve tercihlerinizin yönetilmesi için çerezler ve yerel
            depolama kullanılabilir. Tarayıcı ayarlarınızdan çerezleri
            kısıtlayabilirsiniz; bu durumda Platform’un bazı işlevleri sınırlı
            çalışabilir.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>11. Değişiklikler</h2>
          <p>
            Bu politika güncellenebilir. Önemli değişiklikler mümkün olduğunca
            Platform üzerinden duyurulur; sayfadaki “son güncelleme” tarihini
            kontrol etmeniz yeterlidir.
          </p>
          <p style={{ marginTop: 16 }}>
            İlgili:{" "}
            <Link
              href="/uyelik-sozlesmesi"
              style={{ color: "var(--primary)", textDecoration: "underline" }}
            >
              Üyelik Sözleşmesi ve Kullanım Şartları
            </Link>
          </p>
        </section>
      </article>
    </main>
  );
}
