import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MemberNav } from "@/components/member-nav";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
    return null;
  }
  return (
    <div className="min-h-screen bg-primary pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <MemberNav />
    </div>
  );
}
