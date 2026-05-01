"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("Supabase yapılandırması eksik.");
      return;
    }
    setLoading(true);
    const { error: signError } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() }
      }
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
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
    <main className="container">
      <h1 className="section-title">Üye ol</h1>
      <section className="panel" style={{ maxWidth: 420 }}>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <label>Ad soyad</label>
          <input
            required
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label style={{ marginTop: 12 }}>E-posta</label>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label style={{ marginTop: 12 }}>Şifre (en az 6 karakter)</label>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="notice" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ marginTop: 14, width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Kaydediliyor…" : "Üye ol"}
          </button>
        </form>
        <p className="meta" style={{ marginTop: 16 }}>
          Zaten üye misin? <Link href="/login">Giriş yap</Link>
        </p>
      </section>
    </main>
  );
}
