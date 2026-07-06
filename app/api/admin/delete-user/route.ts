import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const targetUserId = typeof body?.userId === "string" ? body.userId : "";

  if (!targetUserId) {
    return NextResponse.json({ error: "Falta el usuario a eliminar" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor" }, { status: 500 });
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
