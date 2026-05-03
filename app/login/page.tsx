"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import AuthSplitShell from "@/components/auth/AuthSplitShell";
import { mapAuthErrorToTurkish } from "@/lib/auth-errors";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

/** Open redirect / Next.js "Invalid path" önleme: yalnızca site içi path */
function safeInternalPath(raw: string | null): string {
  if (!raw) return "/";
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  if (s.includes("://")) return "/";
  return s;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeInternalPath(searchParams.get("next"));
  const registered = searchParams.get("registered");
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
    const { error: signError } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    setLoading(false);
    if (signError) {
      setError(mapAuthErrorToTurkish(signError));
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <h1 className="section-title">Giriş yap</h1>
        <p className="notice">
          Ortamda Supabase anahtarları yok. `.env.local` içinde
          NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın.
        </p>
      </main>
    );
  }

  return (
    <AuthSplitShell
      title="Nakits.com'a hoş geldiniz"
      footer={
        <p className="meta" style={{ marginTop: 18 }}>
          Hesabın yok mu? <Link href="/register">Üye ol</Link>
        </p>
      }
    >
      {registered && (
        <p className="notice" style={{ marginBottom: 14 }}>
          Kayıt tamam. Şimdi giriş yapabilirsin.
        </p>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <label>E-posta</label>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label style={{ marginTop: 12 }}>Şifre</label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="notice" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}
        <button
          className="btn btn-auth-cta"
          style={{ marginTop: 14 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </AuthSplitShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthSplitShell title="Giriş">
          <p className="meta">Yükleniyor…</p>
        </AuthSplitShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
