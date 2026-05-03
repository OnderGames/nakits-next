import Link from "next/link";
import { notFound } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import ProfileOwnerInboxLink from "@/components/ProfileOwnerInboxLink";
import {
  fetchPublicActiveListingsForSeller,
  fetchPublicProfileByPublicCode
} from "@/lib/listings-data";
import { isMemberPublicCode } from "@/lib/profile-public";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const code = id.trim();
  if (!isMemberPublicCode(code) || !hasSupabaseConfig || !supabase) {
    return { title: "Üye profili — Nakits" };
  }
  const profile = await fetchPublicProfileByPublicCode(supabase, code);
  if (!profile) return { title: "Üye profili — Nakits" };
  return {
    title: `${profile.displayName} (${profile.publicCode}) — Nakits`,
    description: `${profile.displayName} kullanıcısının yayındaki ilanları.`
  };
}

export default async function PublicUserProfilePage({ params }: Props) {
  const { id } = await params;
  const code = id.trim();

  if (!isMemberPublicCode(code)) {
    notFound();
  }

  if (!hasSupabaseConfig || !supabase) {
    return (
      <main className="container">
        <h1 className="section-title">Üye profili</h1>
        <p className="notice">Bu sayfa için Supabase yapılandırması gerekir.</p>
      </main>
    );
  }

  const profile = await fetchPublicProfileByPublicCode(supabase, code);
  if (!profile) {
    notFound();
  }

  const listings = await fetchPublicActiveListingsForSeller(supabase, profile.id);

  return (
    <main className="container">
      <p className="meta" style={{ marginBottom: 12 }}>
        <Link href="/listings">← İlanlar</Link>
      </p>
      <h1 className="section-title">{profile.displayName}</h1>
      <section className="panel" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 18 }}>
          <strong>{profile.displayName}</strong>
        </p>
        <p className="meta" style={{ marginTop: 8 }}>
          Üye no: <strong>{profile.publicCode}</strong>
        </p>
        {profile.city && (
          <p className="meta" style={{ marginTop: 8 }}>
            {profile.city}
          </p>
        )}
        <p className="meta" style={{ marginTop: 10 }}>
          Aşağıda bu üyenin şu an yayındaki ilanları listelenir.
        </p>
        <ProfileOwnerInboxLink profileId={profile.id} />
      </section>

      <h2 className="section-title">Yayındaki ilanlar</h2>
      {listings.length === 0 ? (
        <section className="panel account-empty-panel">
          <p className="account-empty-panel__text">
            Bu üyenin şu an yayındaki ilanı yok.
          </p>
          <Link href="/listings" className="btn btn-outline account-empty-panel__cta">
            İlanlara git
          </Link>
        </section>
      ) : (
        <section className="cards cards--browse">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </main>
  );
}
