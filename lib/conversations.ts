import type { SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_LISTING_IMG =
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80";

function embedOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export type ConversationSummary = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  otherPartyName: string;
  /** Karşı tarafın profil bağlantısı için */
  otherPartyId: string;
  /** /kullanici/{code} — migration yoksa boş olabilir */
  otherPartyPublicCode: string;
  /** Son sıralama için ISO tarih */
  sortAt: string;
  role: "buyer" | "seller";
  /** Karşı taraftan gelen okunmamış mesaj sayısı */
  unreadCount?: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  /** Karşı taraf okudu (yalnızca kendi gönderdiğim mesajlarda) */
  readByOtherAt?: string | null;
};

export async function getOrCreateConversation(
  sb: SupabaseClient,
  listingId: string,
  sellerId: string
): Promise<{ conversationId: string } | { error: string }> {
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { error: "Oturum gerekli." };
  if (uid === sellerId) return { error: "Kendi ilanına mesaj gönderemezsin." };

  const { data: existing } = await sb
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", uid)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing?.id) return { conversationId: existing.id as string };

  const { data: ins, error } = await sb
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_id: uid,
      seller_id: sellerId
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: again } = await sb
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", uid)
        .eq("seller_id", sellerId)
        .maybeSingle();
      if (again?.id) return { conversationId: again.id as string };
    }
    return { error: error.message };
  }
  return { conversationId: ins.id as string };
}

/** Üst menü / liste rozetini yenilemek için */
export function notifyUnreadRefresh(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nakits-unread"));
  }
}

export async function fetchTotalUnreadMessages(
  sb: SupabaseClient
): Promise<number> {
  const { data, error } = await sb.rpc("my_total_unread_messages");
  if (error) return 0;
  if (typeof data === "number" && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 0;
}

async function unreadCountForConversation(
  sb: SupabaseClient,
  userId: string,
  conversationId: string,
  lastReadAt: string | null | undefined
): Promise<number> {
  let q = sb
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);
  if (lastReadAt) {
    q = q.gt("created_at", lastReadAt);
  }
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function markConversationRead(
  sb: SupabaseClient,
  conversationId: string
): Promise<void> {
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  await sb.from("conversation_reads").upsert(
    {
      conversation_id: conversationId,
      profile_id: uid,
      last_read_at: new Date().toISOString()
    },
    { onConflict: "conversation_id,profile_id" }
  );
}

function humanizeMessageInsertError(
  code: string | undefined,
  message: string
): string {
  if (code === "23503") {
    return `${message} Profil kaydı eksik olabilir; bir kez çıkış yapıp tekrar giriş dene.`;
  }
  return message;
}

export async function sendMessage(
  sb: SupabaseClient,
  conversationId: string,
  body: string
): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Mesaj boş olamaz." };

  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: "Oturum gerekli." };

  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { error: "Oturum gerekli." };

  const { error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    sender_id: uid,
    body: text
  });

  if (error) {
    return {
      error: humanizeMessageInsertError(
        error.code,
        error.message ?? "Gönderilemedi."
      )
    };
  }

  if (typeof window !== "undefined") {
    void fetch("/api/messages/notify", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId, preview: text })
    }).catch(() => {});
  }

  return {};
}

export async function fetchMessages(
  sb: SupabaseClient,
  conversationId: string,
  viewerId: string,
  otherPartyId: string
): Promise<ChatMessage[]> {
  const { data, error } = await sb
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const ids = data.map((m) => m.id as string);
  let hidden = new Set<string>();
  if (ids.length > 0) {
    const { data: hidRows } = await sb
      .from("message_hidden_by_user")
      .select("message_id")
      .eq("profile_id", viewerId)
      .in("message_id", ids);
    hidden = new Set(
      (hidRows ?? []).map((r) => String((r as { message_id: string }).message_id))
    );
  }

  const visibleRaw = data.filter((m) => !hidden.has(m.id as string));

  const mySentIds = visibleRaw
    .filter((m) => (m.sender_id as string) === viewerId)
    .map((m) => m.id as string);

  let readMap: Record<string, string> = {};
  if (mySentIds.length > 0) {
    const { data: reads } = await sb
      .from("message_reads")
      .select("message_id, read_at")
      .eq("reader_id", otherPartyId)
      .in("message_id", mySentIds);
    readMap = Object.fromEntries(
      (reads ?? []).map((r) => [
        (r as { message_id: string }).message_id,
        String((r as { read_at: string }).read_at)
      ])
    );
  }

  return visibleRaw.map((m) => {
    const id = m.id as string;
    const senderId = m.sender_id as string;
    const mine = senderId === viewerId;
    return {
      id,
      body: String(m.body),
      senderId,
      createdAt: String(m.created_at),
      readByOtherAt: mine ? readMap[id] ?? null : undefined
    };
  });
}

/** Karşı tarafın gönderdiği tüm mesajları okundu işaretle (görüldü bildirimi için) */
export async function markIncomingMessagesAsRead(
  sb: SupabaseClient,
  conversationId: string,
  readerId: string,
  otherPartyId: string
): Promise<void> {
  const { data: incoming } = await sb
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("sender_id", otherPartyId);

  const rows = (incoming ?? []).map((row) => ({
    message_id: row.id as string,
    reader_id: readerId,
    read_at: new Date().toISOString()
  }));
  if (rows.length === 0) return;

  await sb.from("message_reads").upsert(rows, {
    onConflict: "message_id,reader_id",
    ignoreDuplicates: true
  });
}

/** Gelen mesajı yalnızca benim görünümümden kaldır */
export async function hideIncomingMessageForUser(
  sb: SupabaseClient,
  messageId: string
): Promise<{ error?: string }> {
  const { data: userData } = await sb.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { error: "Oturum gerekli." };

  const { error } = await sb.from("message_hidden_by_user").insert({
    message_id: messageId,
    profile_id: uid
  });

  if (error?.code === "23505") return {};
  if (error) return { error: error.message };
  return {};
}

export async function fetchMyConversations(
  sb: SupabaseClient,
  userId: string
): Promise<ConversationSummary[]> {
  const { data: convs, error } = await sb
    .from("conversations")
    .select(
      `
      id,
      buyer_id,
      seller_id,
      created_at,
      last_message_at,
      listings (
        id,
        title,
        listing_images ( image_url, sort_order )
      )
    `
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (error || !convs?.length) return [];

  const otherIds = convs.map((c) => {
    const row = c as { buyer_id: string; seller_id: string };
    return row.buyer_id === userId ? row.seller_id : row.buyer_id;
  });

  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name, public_code")
    .in("id", otherIds);

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((p) => [
      p.id as string,
      (p.full_name as string)?.trim() || "Üye"
    ])
  );
  const codeMap = Object.fromEntries(
    (profiles ?? []).map((p) => [
      p.id as string,
      ((p.public_code as string) ?? "").trim()
    ])
  );

  const rows: ConversationSummary[] = [];

  for (const raw of convs) {
    const c = raw as {
      id: string;
      buyer_id: string;
      seller_id: string;
      created_at: string;
      last_message_at: string | null;
      listings: unknown;
    };
    const listing = embedOne(
      c.listings as
        | {
            id: string;
            title: string;
            listing_images: { image_url: string; sort_order: number }[] | null;
          }
        | {
            id: string;
            title: string;
            listing_images: { image_url: string; sort_order: number }[] | null;
          }[]
        | null
    );
    const imgs = [...(listing?.listing_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const cover = imgs[0]?.image_url ?? FALLBACK_LISTING_IMG;
    const otherId = c.buyer_id === userId ? c.seller_id : c.buyer_id;
    const sortAt = c.last_message_at ?? c.created_at;

    rows.push({
      id: c.id,
      listingId: listing?.id ?? "",
      listingTitle: listing?.title ?? "İlan",
      listingImage: cover,
      otherPartyName: nameMap[otherId] ?? "Üye",
      otherPartyId: otherId,
      otherPartyPublicCode: codeMap[otherId] ?? "",
      sortAt,
      role: c.buyer_id === userId ? "buyer" : "seller"
    });
  }

  rows.sort(
    (a, b) =>
      new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
  );

  const convIds = rows.map((r) => r.id);
  if (convIds.length === 0) return rows;

  const { data: reads, error: readsErr } = await sb
    .from("conversation_reads")
    .select("conversation_id, last_read_at")
    .eq("profile_id", userId)
    .in("conversation_id", convIds);

  const readMap = readsErr
    ? {}
    : Object.fromEntries(
        (reads ?? []).map((r) => [
          r.conversation_id as string,
          r.last_read_at as string
        ])
      );

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const lr = readMap[row.id];
      const unreadCount = await unreadCountForConversation(
        sb,
        userId,
        row.id,
        lr
      );
      return { ...row, unreadCount };
    })
  );

  return enriched;
}

export type ConversationParticipantsInfo = {
  buyerId: string;
  sellerId: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  buyerPublicCode: string;
  sellerPublicCode: string;
};

export async function fetchConversationParticipants(
  sb: SupabaseClient,
  conversationId: string
): Promise<ConversationParticipantsInfo | null> {
  const { data, error } = await sb
    .from("conversations")
    .select(
      `
      buyer_id,
      seller_id,
      listings ( title ),
      buyer_profile:profiles!buyer_id ( full_name, public_code ),
      seller_profile:profiles!seller_id ( full_name, public_code )
    `
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    buyer_id: string;
    seller_id: string;
    listings: { title: string } | { title: string }[] | null;
    buyer_profile:
      | { full_name: string | null; public_code: string | null }
      | { full_name: string | null; public_code: string | null }[]
      | null;
    seller_profile:
      | { full_name: string | null; public_code: string | null }
      | { full_name: string | null; public_code: string | null }[]
      | null;
  };
  const listing = embedOne(row.listings);
  const bp = embedOne(row.buyer_profile);
  const sp = embedOne(row.seller_profile);
  const bn = bp?.full_name?.trim();
  const sn = sp?.full_name?.trim();
  const bpc = bp?.public_code?.trim() ?? "";
  const spc = sp?.public_code?.trim() ?? "";

  return {
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    listingTitle: listing?.title ?? "İlan",
    buyerName: bn && bn.length > 0 ? bn : "Üye",
    sellerName: sn && sn.length > 0 ? sn : "Üye",
    buyerPublicCode: bpc,
    sellerPublicCode: spc
  };
}
