import { Link } from "react-router-dom";
import EqMeter from "./EqMeter";
import OnAir from "./OnAir";
import Waveform from "./Waveform";
import { genreHex } from "../lib/genreColors";

// A profile card for the discovery feed. The read serializer carries `username`,
// so every card links to the public profile at /u/:username.
export default function ProfileCard({ profile }) {
  const instruments = profile.instruments || [];
  const genres = profile.genres || [];
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  // Left accent rail takes the first genre's color (vibe-at-a-glance).
  const rail = genres[0] ? genreHex(genres[0].name) : "#3a3a4f";

  const body = (
    <div
      className="card card-interactive group relative h-full overflow-hidden border-l-2"
      style={{ borderLeftColor: rail }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-xs uppercase tracking-wider text-slate-500">
            {profile.username ? `@${profile.username}` : "Musician"}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-white">
            {location || "Location not set"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {profile.sound_url && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-wave-500/40 px-2 py-0.5 text-[10px] font-semibold text-wave-400"
              title="Has a track"
            >
              ▶ track
            </span>
          )}
          <OnAir available={profile.is_available} />
        </div>
      </div>

      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-400">{profile.bio}</p>
      )}

      {instruments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {instruments.slice(0, 4).map((mi) => (
            <span
              key={mi.instrument.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800/60 px-2 py-1 text-xs text-slate-200"
            >
              <EqMeter proficiency={mi.proficiency} />
              {mi.instrument.name}
            </span>
          ))}
        </div>
      )}

      {genres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {genres.slice(0, 5).map((g) => {
            const c = genreHex(g.name);
            return (
              <span
                key={g.id}
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{ borderColor: `${c}55`, color: c }}
              >
                {g.name}
              </span>
            );
          })}
        </div>
      )}

      <Waveform className="mt-4 h-6 w-full text-ink-700 transition-colors duration-300 group-hover:text-wave-500/50" />
    </div>
  );

  return profile.username ? (
    <Link to={`/u/${profile.username}`} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
