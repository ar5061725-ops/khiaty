import Link from "next/link";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="28" fill="#651F37" />
      <path d="M30 52 C46 42, 74 40, 92 50 C70 52, 50 62, 44 78 C40 92, 56 104, 76 100 C92 97, 100 86, 98 74" fill="none" stroke="#E7D3A6" strokeWidth="8" strokeLinecap="round" />
      <g transform="rotate(-38 64 64)"><rect x="60" y="14" width="8" height="62" rx="3" fill="#B99858" /></g>
      <circle cx="64" cy="28" r="7" fill="#FAF6EF" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="خياطتي — الرئيسية">
      <LogoMark />
      <span>خياطتي</span>
    </Link>
  );
}
