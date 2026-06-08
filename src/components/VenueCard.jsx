import { Link } from "react-router-dom";

// A venue card for the browse feed. Links to the venue page at /venues/:slug.
export default function VenueCard({ venue }) {
  const location = [venue.city, venue.country].filter(Boolean).join(", ");

  return (
    <Link to={`/venues/${venue.slug}`} className="block">
      <div className="card card-interactive group relative h-full overflow-hidden border-l-2 border-amber-500/50">
        <h3 className="text-base font-semibold text-white group-hover:text-wave-400">
          {venue.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {location || "Location not set"}
          {venue.capacity ? ` · holds ${venue.capacity}` : ""}
        </p>

        {venue.description && (
          <p className="mt-3 line-clamp-3 text-sm text-slate-400">
            {venue.description}
          </p>
        )}
      </div>
    </Link>
  );
}
