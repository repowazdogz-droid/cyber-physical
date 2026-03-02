import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RedirectAfterLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
    return null;
  }
  redirect("/home");
}
