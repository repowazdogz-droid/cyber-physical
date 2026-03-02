import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Settings</h1>
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-4">
        <p className="text-[#a0a0a0] text-sm">
          Gym settings, class config, and membership tiers. Configure membership rates and class capacity here.
        </p>
        <p className="text-[#a0a0a0] text-sm">
          To make yourself an admin: run in Supabase SQL editor:{" "}
          <code className="text-[#c8a951]">update public.profiles set role = &apos;admin&apos; where id = auth.uid();</code>
        </p>
      </div>
    </div>
  );
}
