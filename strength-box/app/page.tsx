import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo placeholder */}
        <div className="h-24 w-24 mx-auto rounded-lg bg-[#2a2a2a] border border-[#c8a951]/30 flex items-center justify-center text-[#c8a951] text-2xl font-bold">
          SB
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f1f1f1]">Strength Box Bristol</h1>
          <p className="text-[#a0a0a0] mt-1">Unit 5B, Merton Road, Bishopston, Bristol BS7 8TL</p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/login"
            className="touch-target flex items-center justify-center rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-6 py-3"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="touch-target flex items-center justify-center rounded-lg border border-[#c8a951]/60 text-[#c8a951] font-semibold px-6 py-3"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
