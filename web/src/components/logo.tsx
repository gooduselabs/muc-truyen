import Link from 'next/link';
export function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-xl bg-brand font-serif text-lg font-bold text-white shadow-[0_6px_18px_-6px_var(--brand)] transition-transform group-hover:-rotate-6">
        M<span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-bg bg-gold" />
      </span>
      {!small && <span className="font-serif text-2xl font-bold tracking-tight">Mực<span className="text-brand">.</span></span>}
    </Link>
  );
}
