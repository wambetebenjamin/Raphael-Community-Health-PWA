import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Brand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link className={`brand${compact ? " brand-compact" : ""}`} href={href} aria-label="Raphael Community Health home">
      <span className="brand-mark" aria-hidden="true"><HeartPulse /></span>
      <span className="brand-copy">
        <strong>Raphael Community Health</strong>
        {!compact && <small>Field care, even offline</small>}
      </span>
    </Link>
  );
}
