"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase";

type Props = {
  profileId: string;
};

/** Üye herkese açık profilde kendi sayfasındayken gelen kutusuna gider. */
export default function ProfileOwnerInboxLink({ profileId }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setReady(true);
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setIsOwner(Boolean(data.session?.user?.id === profileId));
      setReady(true);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_e, session) => {
      setIsOwner(Boolean(session?.user?.id === profileId));
    });
    return () => subscription.unsubscribe();
  }, [profileId]);

  if (!ready || !isOwner) return null;

  return (
    <p style={{ marginTop: 16 }}>
      <Link className="btn btn-nakits-cta" href="/mesajlar">
        Mesajlarım
      </Link>
    </p>
  );
}
