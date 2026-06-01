// Turn a user-pasted track URL into an embeddable player descriptor.
// Supports YouTube, Spotify, SoundCloud; anything else falls back to a link.

export function toEmbed(rawUrl) {
  if (!rawUrl) return null;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  // --- YouTube ---
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { type: "youtube", src: `https://www.youtube.com/embed/${id}`, ratio: true };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") || url.pathname.split("/embed/")[1] || "";
    if (id) return { type: "youtube", src: `https://www.youtube.com/embed/${id}`, ratio: true };
  }

  // --- Spotify ---
  if (host === "open.spotify.com") {
    const [, kind, id] = url.pathname.split("/");
    if (kind && id) {
      const compact = kind === "track" || kind === "episode";
      return {
        type: "spotify",
        src: `https://open.spotify.com/embed/${kind}/${id}`,
        height: compact ? 152 : 352,
      };
    }
  }

  // --- SoundCloud (widget player) ---
  if (host === "soundcloud.com") {
    return {
      type: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        rawUrl
      )}&color=%232dd4bf&visual=false`,
      height: 166,
    };
  }

  // --- Unknown provider — link out ---
  return { type: "link", src: rawUrl };
}
