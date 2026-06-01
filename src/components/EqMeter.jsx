// Instrument proficiency as a 3-bar mixer/EQ meter.
//   beginner → 1 bar · intermediate → 2 · advanced → 3
const LEVEL = { beginner: 1, intermediate: 2, advanced: 3 };
const HEIGHTS = ["h-2", "h-3", "h-4"];

export default function EqMeter({ proficiency = "intermediate", className = "" }) {
  const lit = LEVEL[proficiency] ?? 2;
  return (
    <span
      className={`inline-flex items-end gap-0.5 ${className}`}
      role="img"
      aria-label={`Proficiency: ${proficiency}`}
      title={proficiency}
    >
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${h} ${i < lit ? "bg-glow-400" : "bg-ink-600"}`}
        />
      ))}
    </span>
  );
}
