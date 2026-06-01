// Map a genre to a stable accent color so the discovery feed reads "by vibe."
// Known families get hand-picked hues; anything else hashes to a stable HSL.

const FAMILIES = [
  { hex: "#f43f5e", keys: ["metal", "punk", "hard rock", "heavy"] }, // crimson
  { hex: "#f59e0b", keys: ["jazz", "blues", "soul", "funk", "gospel", "r&b"] }, // amber
  { hex: "#8b5cf6", keys: ["electronic", "edm", "ambient", "experimental", "k-pop", "hip-hop"] }, // violet
  { hex: "#22c55e", keys: ["folk", "country", "world", "reggae", "ska", "afro"] }, // green
  { hex: "#2dd4bf", keys: ["rock", "indie", "pop", "progressive"] }, // teal
  { hex: "#e879f9", keys: ["classical", "chamber", "carnatic", "hindustani", "flamenco", "latin", "bollywood", "fusion"] }, // fuchsia
];

export function genreHex(name = "") {
  const n = name.toLowerCase();
  for (const fam of FAMILIES) {
    if (fam.keys.some((k) => n.includes(k))) return fam.hex;
  }
  // Deterministic fallback hue from the name.
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 62%)`;
}
