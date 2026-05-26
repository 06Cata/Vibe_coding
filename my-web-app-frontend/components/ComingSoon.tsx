type ComingSoonProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function ComingSoon({
  eyebrow,
  title,
  description,
}: ComingSoonProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 py-12 pt-16 text-white">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-black/20">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-orange-100 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-300">{description}</p>
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-gray-950/60 px-5 py-4 text-sm font-bold text-gray-400">
          這個頁面會保留原本 my-web-app 的功能，之後逐步改成呼叫 backend API。
        </div>
      </section>
    </main>
  );
}
