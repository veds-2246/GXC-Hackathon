import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLockup({ className = "", priority = false }: BrandLockupProps) {
  return (
    <Link
      href="/"
      aria-label="GenXCode Hackathon home"
      className={`brand-lockup ${className}`}
    >
      <Image
        src="/genxcode-mark.webp"
        alt=""
        width={48}
        height={48}
        priority={priority}
        className="brand-mark"
      />
      <span className="brand-type">
        <span className="brand-name">GenXCode</span>
        <span className="brand-subtitle">HACKATHON</span>
      </span>
    </Link>
  );
}
