// Decorative SVG waveform strip — card footers and section dividers.
// Deterministic bar heights so it renders identically every time.
const BARS = Array.from({ length: 48 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 0.5) * 0.6 + Math.sin(i * 1.3) * 0.4);
  return 0.18 + v * 0.82; // 0..1
});

export default function Waveform({ className = "" }) {
  return (
    <svg
      viewBox="0 0 192 32"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {BARS.map((b, i) => {
        const h = b * 28;
        return (
          <rect
            key={i}
            x={i * 4}
            y={(32 - h) / 2}
            width="2"
            height={h}
            rx="1"
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
