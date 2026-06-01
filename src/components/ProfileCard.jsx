import { Link } from "react-router-dom";

// A profile card for the discovery feed. The read serializer carries `username`,
// so every card links to the public profile at /u/:username.
export default function ProfileCard({ profile }) {
  const instruments = profile.instruments || [];
  const genres = profile.genres || [];
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  const body = (
    <div className="card h-full transition hover:border-wave-500/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {profile.username ? `@${profile.username}` : "Musician"}
          </p>
          <p className="mt-0.5 text-base font-semibold text-white">
            {location || "Location not set"}
          </p>
        </div>
        <span
          className={`chip ${
            profile.is_available
              ? "border-wave-500/40 text-wave-400"
              : "text-slate-500"
          }`}
        >
          {profile.is_available ? "Available" : "Busy"}
        </span>
      </div>

      {profile.bio && (
        <p className="mt-3 line-clamp-3 text-sm text-slate-400">{profile.bio}</p>
      )}

      {instruments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {instruments.slice(0, 4).map((mi) => (
            <span key={mi.instrument.id} className="chip border-glow-500/40 text-glow-400">
              {mi.instrument.name}
              <span className="text-slate-500">· {mi.proficiency}</span>
            </span>
          ))}
        </div>
      )}

      {genres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {genres.slice(0, 5).map((g) => (
            <span key={g.id} className="chip">
              {g.name}
            </span>
          ))}
        </div>
      )}
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
