import Link from "next/link";

type BrandLockupProps = {
  className?: string;
};

export function BrandLockup({ className = "" }: BrandLockupProps) {
  return (
    <Link
      href="/"
      aria-label="GenXCode Hackathon home"
      className={`brand-lockup ${className}`}
    >
      <span className="brand-name">GenXCode</span>
      <span className="brand-subtitle">HACKATHON</span>
    </Link>
  );
}
