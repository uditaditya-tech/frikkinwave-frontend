export default function Spinner({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-10 text-slate-400 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-600 border-t-wave-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
