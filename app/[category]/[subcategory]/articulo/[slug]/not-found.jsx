import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-6">
          Article Not Found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/" className="px-6 py-3 bg-[#00BFFF] text-white rounded-lg hover:bg-[#0099CC] transition">
          Return Home
        </Link>
      </div>
    </main>
  );
}
