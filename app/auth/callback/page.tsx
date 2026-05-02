"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Hesabınız doğrulanıyor…");

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";

    async function run() {
      const sb = getSupabaseBrowser();
      if (!sb) {
        router.replace("/login");
        return;
      }

      const href =
        typeof window !== "undefined" ? window.location.href : "";
      const hasCode = href.includes("code=");

      if (hasCode) {
        const { error } = await sb.auth.exchangeCodeForSession(href);
        if (error) {
          setMessage(
            "Bağlantı geçersiz veya süresi dolmuş. Yeni bir onay e-postası isteyin veya tekrar kayıt olun."
          );
          setTimeout(() => router.replace("/login?error=auth"), 3500);
          return;
        }
        router.replace(next);
        router.refresh();
        return;
      }

      const { data } = await sb.auth.getSession();
      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }

      setMessage("Oturum açılamadı. Giriş sayfasına yönlendiriliyorsunuz.");
      setTimeout(() => router.replace("/login"), 2000);
    }

    void run();
  }, [router, searchParams]);

  return (
    <main className="container">
      <p className="meta">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="meta">Yükleniyor…</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
