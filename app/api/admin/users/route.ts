import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";
import type { User } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffRow =
  | {
      app_role: string;
      is_blocked: boolean;
      moderation_flagged: boolean;
      admin_verified_email: boolean;
      admin_verified_phone: boolean;
    }
  | null;

function embedStaff(profileStaff: StaffRow | StaffRow[]): StaffRow | null {
  if (profileStaff == null) return null;
  if (Array.isArray(profileStaff)) {
    const first = profileStaff[0];
    return first ?? null;
  }
  return profileStaff;
}

function authConfirmed(u: User) {
  const emailOk = Boolean(u.email_confirmed_at || u.confirmed_at);
  const phoneOk = Boolean(u.phone_confirmed_at);
  return { emailOk, phoneOk };
}

async function fetchAuthConfirmedMap(adminSb: NonNullable<ReturnType<typeof getServiceRoleClient>>): Promise<
  Map<string, { emailOk: boolean; phoneOk: boolean }>
> {
  const map = new Map<string, { emailOk: boolean; phoneOk: boolean }>();
  let page = 1;
  const perPage = 250;
  for (let guard = 0; guard < 500; guard += 1) {
    const res = await adminSb.auth.admin.listUsers({ page, perPage });
    if (res.error || !res.data?.users?.length) break;
    for (const u of res.data.users) {
      map.set(u.id, authConfirmed(u));
    }
    if (res.data.users.length < perPage) break;
    page += 1;
  }
  return map;
}

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const [{ data: profs, error: pErr }, authMap] = await Promise.all([
    adminSb
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        public_code,
        created_at,
        profile_staff (
          app_role,
          is_blocked,
          moderation_flagged,
          admin_verified_email,
          admin_verified_phone
        )
      `)
      .order("created_at", { ascending: false })
      .limit(500),
    fetchAuthConfirmedMap(adminSb)
  ]);

  if (pErr) {
    return Response.json({ error: pErr.message }, { status: 500 });
  }

  type ProfileRowRaw = {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    public_code: string;
    created_at: string;
    profile_staff?: StaffRow | StaffRow[];
  };

  const users = ((profs ?? []) as ProfileRowRaw[]).map((p) => {
    const staff = embedStaff(p.profile_staff ?? null);
    const authHints = authMap.get(p.id) ?? { emailOk: false, phoneOk: false };
    return {
      id: p.id,
      email: p.email ?? "",
      full_name: (p.full_name ?? "").trim(),
      phone: (p.phone ?? "").trim(),
      public_code: p.public_code ?? "",
      created_at: p.created_at,
      app_role:
        staff?.app_role === "moderator" || staff?.app_role === "admin"
          ? staff.app_role
          : "member",
      is_blocked: Boolean(staff?.is_blocked),
      moderation_flagged: Boolean(staff?.moderation_flagged),
      admin_verified_email: Boolean(staff?.admin_verified_email),
      admin_verified_phone: Boolean(staff?.admin_verified_phone),
      auth_email_verified: authHints.emailOk,
      auth_phone_verified: authHints.phoneOk
    };
  });

  return Response.json({ users });
}
