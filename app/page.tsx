import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1c5f35] text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center rounded-3xl border border-white/10 bg-black/20 p-8 shadow-2xl">
        <img
          src="/brand/fratelli-logo-pizza-p-2000.png"
          alt="Fratelli"
          className="w-28 mx-auto mb-6"
        />

        <h1 className="text-4xl md:text-5xl font-black mb-3">
          Fratelli Ordering
        </h1>

        <p className="text-white/80 mb-8">
          Scan your table QR code to open the correct table ordering page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/table/1"
            className="rounded-2xl border-4 border-black bg-[#f7931e] px-6 py-3 text-black font-black uppercase"
          >
            Test Table 1
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}