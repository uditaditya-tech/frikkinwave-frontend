import { toEmbed } from "../lib/embed";

// Renders an embedded player for a profile's sound_url. Falls back to a
// "Listen" link for providers we don't have an embed for.
export default function SoundEmbed({ url, className = "" }) {
  const e = toEmbed(url);
  if (!e) return null;

  if (e.type === "link") {
    return (
      <a
        href={e.src}
        target="_blank"
        rel="noreferrer noopener"
        className={`btn-ghost ${className}`}
      >
        ▶ Listen
      </a>
    );
  }

  if (e.ratio) {
    // 16:9 responsive (YouTube)
    return (
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-ink-700 ${className}`}
        style={{ aspectRatio: "16 / 9" }}
      >
        <iframe
          src={e.src}
          title="Track"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Fixed-height players (Spotify / SoundCloud)
  return (
    <iframe
      src={e.src}
      title="Track"
      className={`w-full rounded-lg border border-ink-700 ${className}`}
      style={{ height: e.height }}
      allow="autoplay; encrypted-media"
      loading="lazy"
    />
  );
}
