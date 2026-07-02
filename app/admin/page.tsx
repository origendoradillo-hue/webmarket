import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const isStaff = profile && ["admin", "superadmin"].includes(profile.role);
  if (!isStaff) redirect("/");

  return <AdminClient role={profile.role} />;
}
