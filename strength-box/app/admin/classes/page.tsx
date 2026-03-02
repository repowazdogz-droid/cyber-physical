import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminClassesPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, description, instructor, day_of_week, start_time, duration_minutes, max_capacity")
    .order("day_of_week");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Classes</h1>
      <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a2a2a] text-[#a0a0a0]">
            <tr>
              <th className="p-3 font-medium">Class</th>
              <th className="p-3 font-medium">Day</th>
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Duration</th>
              <th className="p-3 font-medium">Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a3a]">
            {(classes ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-[#2a2a2a]/50">
                <td className="p-3 font-medium text-[#f1f1f1]">{c.name}</td>
                <td className="p-3 text-[#a0a0a0]">{DAYS[c.day_of_week]}</td>
                <td className="p-3 text-[#a0a0a0]">{c.start_time}</td>
                <td className="p-3 text-[#a0a0a0]">{c.duration_minutes} min</td>
                <td className="p-3 text-[#a0a0a0]">{c.max_capacity}</td>
                <td className="p-3">
                  <Link href={`/admin/classes/${c.id}`} className="text-[#c8a951]">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
