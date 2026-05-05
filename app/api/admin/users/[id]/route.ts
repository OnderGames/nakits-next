import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  hasAdminPower,
  isProtectedAdminEmail,
  verifyModerationStaff,
  type AppRole
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_ROLES: Set<string> = new Set(["member", "moderator", "admin"]);

type PatchBody = {
  app_role?: AppRole;
  is_blocked?: boolean;
  moderation_flagged?: boolean;
  admin_verified_email?: boolean;
  admin_verified_phone?: boolean;
};

type StaffEmbed = { app_role?: string | null } | null | undefined;

function firstStaff(embed: StaffEmbed | StaffEmbed[]): StaffEmbed | null {
  if (embed == null) return null;
  if (Array.isArray(embed)) return embed[0] ?? null;
  return embed ?? null;
}

function roleOfStaff(st: StaffEmbed | StaffEmbed[]): "member" | "moderator" | "admin" {
  const s = firstStaff(st);
  const r = (s?.app_role ?? "").toLowerCase();
  if (r === "moderator" || r === "admin") return r;
  return "member";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { id: targetId } = await context.params;
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { data: targetRow, error: tErr } = await adminSb
    .from("profiles")
    .select(`
      email,
      profile_staff (
        app_role
      )
    `)
    .eq("id", targetId)
    .maybeSingle();

  if (tErr) {
    return Response.json({ error: tErr.message }, { status: 500 });
  }
  if (!targetRow || !(targetRow as { email?: string }).email) {
    return Response.json({ error: "Üye bulunamadı." }, { status: 404 });
  }

  type TargetProbe = {
    email: string;
    profile_staff?: StaffEmbed | StaffEmbed[];
  };
  const prow = targetRow as TargetProbe;
  const targetEmail = prow.email;
  const existingRole = roleOfStaff(prow.profile_staff);

  if (targetId === v.userId) {
    if (body.app_role !== undefined || body.is_blocked === true) {
      return Response.json(
        {
          error:
            "Kendi rolünüzü düşürmenize veya hesabınızı buradan engellemenize izin verilmez."
        },
        { status: 400 }
      );
    }
  }

  const power = hasAdminPower(v);

  const roleChangeRequested =
    typeof body.app_role === "string" && APP_ROLES.has(body.app_role);

  if (
    !power &&
    (existingRole === "admin" || existingRole === "moderator")
  ) {
    return Response.json(
      {
        error:
          "Moderatör/admin rolündeki üyeleri yalnız tam yöneticiler düzenleyebilir."
      },
      { status: 403 }
    );
  }

  if (isProtectedAdminEmail(targetEmail)) {
    if (!power) {
      return Response.json(
        {
          error:
            "ADMIN_EMAILS listesindeki hesaplarda yalnız tam yöneticiler değişiklik yapabilir."
        },
        { status: 403 }
      );
    }
    if (roleChangeRequested && body.app_role !== "admin") {
      return Response.json(
        {
          error:
            "ADMIN_EMAILS hesaplarının rolü admin dışına düşürülemez (önce ortamdan e-postayı kaldırın)."
        },
        { status: 400 }
      );
    }
  }

  if (roleChangeRequested && !power) {
    return Response.json(
      { error: "Rol değiştirmek için tam yönetici (ADMIN_EMAILS veya admin rolü) gerekir." },
      { status: 403 }
    );
  }

  const patch: Record<string, unknown> = {};

  const boolKeys = [
    "is_blocked",
    "moderation_flagged",
    "admin_verified_email",
    "admin_verified_phone"
  ] as const;
  for (const k of boolKeys) {
    if (body[k] === undefined) continue;
    patch[k] = Boolean(body[k]);
  }

  if (roleChangeRequested) {
    patch.app_role = body.app_role;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const sel = await adminSb
    .from("profile_staff")
    .select("profile_id")
    .eq("profile_id", targetId)
    .maybeSingle();

  if (sel.error) {
    return Response.json({ error: sel.error.message ?? "Yetki kaydı okunamadı." }, { status: 500 });
  }

  let errUpsert: string | null = null;
  const rowExists = Boolean(sel.data?.profile_id);

  if (!rowExists) {
    const defaults = {
      profile_id: targetId,
      app_role: "member",
      is_blocked: false,
      moderation_flagged: false,
      admin_verified_email: false,
      admin_verified_phone: false
    };
    const merged = {
      ...defaults,
      ...patch
    };
    const ins = await adminSb.from("profile_staff").insert(merged).select("profile_id").maybeSingle();
    if (ins.error) errUpsert = ins.error.message ?? "insert başarısız";
  } else {
    const up = await adminSb.from("profile_staff").update(patch).eq("profile_id", targetId);
    if (up.error) errUpsert = up.error.message ?? "güncelleme başarısız";
  }

  if (errUpsert) {
    return Response.json(
      {
        error:
          `${errUpsert} — profile_staff yoksa veritabanında sql/migration_profile_staff.sql çalıştırın.`
      },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, id: targetId });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  void request;

  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  if (!hasAdminPower(v)) {
    return Response.json({ error: "Üye silme yalnız tam yöneticilere açıktır." }, { status: 403 });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { id: targetId } = await context.params;

  if (targetId === v.userId) {
    return Response.json({ error: "Kendi hesabınızı bu ekrandan silemezsiniz." }, { status: 400 });
  }

  const { data: targetRow, error: tErr } = await adminSb
    .from("profiles")
    .select(`
      email,
      profile_staff (
        app_role
      )
    `)
    .eq("id", targetId)
    .maybeSingle();

  if (tErr) {
    return Response.json({ error: tErr.message }, { status: 500 });
  }
  if (!targetRow || !(targetRow as { email?: string }).email) {
    return Response.json({ error: "Üye bulunamadı." }, { status: 404 });
  }

  type TargetProbe = { email: string; profile_staff?: StaffEmbed | StaffEmbed[] };
  const prow = targetRow as TargetProbe;
  if (isProtectedAdminEmail(prow.email)) {
    return Response.json({ error: "ADMIN_EMAILS yöneticileri buradan silinemez." }, { status: 403 });
  }

  const existingRole = roleOfStaff(prow.profile_staff);
  if (existingRole === "moderator" || existingRole === "admin") {
    return Response.json(
      {
        error:
          "Moderatör veya admin kullanıcı silinemez — önce rolünü düşürün."
      },
      { status: 400 }
    );
  }

  const { error: delErr } = await adminSb.auth.admin.deleteUser(targetId);
  if (delErr?.message) {
    return Response.json({ error: delErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, id: targetId });
}
