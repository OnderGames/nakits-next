"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { mapAuthErrorToTurkish } from "@/lib/auth-errors";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";
import AuthSplitShell from "@/components/auth/AuthSplitShell";

const termsLinkStyle = { color: "var(--primary)", textDecoration: "underline" as const };

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const nameTrim = fullName.trim();
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();

    if (!nameTrim) {
      setError("Ad soyad zorunludur.");
      return;
    }
    if (!emailTrim) {
      setError("E-posta zorunludur.");
      return;
    }
    if (!phoneTrim) {
      setError("Telefon numarası zorunludur.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (!termsAccepted) {
      setError(
        "Devam etmek için Üyelik Sözleşmesi ve Kullanım Şartları ile Gizlilik / KVKK metnini okuyup kabul etmelisin."
      );
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("Supabase yapılandırması eksik.");
      return;
    }
    setLoading(true);
    const { error: signError } = await sb.auth.signUp({
      email: emailTrim,
      password,
      options: {
        data: { full_name: nameTrim, phone: phoneTrim }
      }
    });
    setLoading(false);
    if (signError) {
      setError(mapAuthErrorToTurkish(signError));
      return;
    }
    router.replace("/login?registered=1");
    router.refresh();
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">Üye ol</h1>
        <p className="notice">
          Ortamda Supabase anahtarları yok. `.env.local` içinde
          NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın.
        </p>
      </main>
    );
  }

  return (
    <AuthSplitShell
      title="Hesabını oluştur"
      footer={
        <p className="meta" style={{ marginTop: 18 }}>
          Zaten üye misin? <Link href="/login">Giriş yap</Link>
        </p>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <label htmlFor="reg-fullname">Ad soyad</label>
          <input
            id="reg-fullname"
            required
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label htmlFor="reg-email" style={{ marginTop: 12 }}>
            E-posta
          </label>
          <input
            id="reg-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="reg-phone" style={{ marginTop: 12 }}>
            Telefon
          </label>
          <input
            id="reg-phone"
            required
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Örn: 05xx xxx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <label htmlFor="reg-password" style={{ marginTop: 12 }}>
            Şifre (en az 6 karakter)
          </label>
          <div className="auth-password-field">
            <input
              id="reg-password"
              required
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "20px minmax(0, 1fr)",
              columnGap: 12,
              rowGap: 0,
              alignItems: "start"
            }}
          >
            <input
              id="reg-terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, cursor: "pointer" }}
            />
            <label
              htmlFor="reg-terms"
              className="auth-terms-checkbox-label"
              style={{
                margin: 0,
                lineHeight: 1.5,
                display: "block",
                minWidth: 0
              }}
            >
              <Link href="/uyelik-sozlesmesi" style={termsLinkStyle}>
                Nakits.com Üyelik Sözleşmesi ve Kullanım Şartları
              </Link>
              ’ni ve{" "}
              <Link href="/gizlilik-politikasi" style={termsLinkStyle}>
                Gizlilik Politikası ile KVKK aydınlatma metnini
              </Link>{" "}
              okudum, anladım; şartları ve kişisel verilerimin bu kapsamda
              işlenmesini kabul ediyorum.
            </label>
          </div>

          {error && (
            <p className="notice" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        <button
          className="btn btn-auth-cta"
          style={{ marginTop: 16 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Kaydediliyor…" : "Oluştur"}
        </button>
      </form>
    </AuthSplitShell>
  );
}
