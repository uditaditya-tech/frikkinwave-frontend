// Availability as an "on-air" pulse — teal when available, dim dot when not.
export default function OnAir({ available, label, className = "" }) {
  if (available) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-wave-400 ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-wave-500/70 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-wave-400" />
        </span>
        {label || "Available"}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-slate-600" />
      Busy
    </span>
  );
}
