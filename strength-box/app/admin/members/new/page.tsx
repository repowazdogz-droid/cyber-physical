import { AddMemberForm } from "./add-member-form";

export default function NewMemberPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Add member</h1>
      <AddMemberForm />
    </div>
  );
}
