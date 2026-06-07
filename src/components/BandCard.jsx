import { Link } from "react-router-dom";

// A band card for the browse feed. Links to the band page at /bands/:slug.
export default function BandCard({ band }) {
  const location = [band.city, band.country].filter(Boolean).join(", ");

  return (
    <Link to={`/bands/${band.slug}`} className="block">
      <div className="card card-interactive group relative h-full overflow-hidden border-l-2 border-glow-500/50">
        <h3 className="text-base font-semibold text-white group-hover:text-wave-400">
          {band.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {location || "Location not set"}
          {band.owner_username && (
            <>
              {" · led by "}
              <span className="text-slate-400">@{band.owner_username}</span>
            </>
          )}
        </p>

        {band.bio && (
          <p className="mt-3 line-clamp-3 text-sm text-slate-400">{band.bio}</p>
        )}
      </div>
    </Link>
  );
}
