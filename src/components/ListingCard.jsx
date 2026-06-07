import { Link } from "react-router-dom";

// Each listing type gets its own accent so the board reads at a glance.
const TYPE_STYLES = {
  gig: { label: "Gig", cls: "border-wave-500/40 text-wave-400", rail: "#2dd4bf" },
  audition: {
    label: "Audition",
    cls: "border-glow-500/40 text-glow-400",
    rail: "#a855f7",
  },
  venue: { label: "Venue", cls: "border-amber-500/40 text-amber-300", rail: "#f59e0b" },
};

export function ListingTypeBadge({ type }) {
  const t = TYPE_STYLES[type] || { label: type, cls: "" };
  return <span className={`chip ${t.cls}`}>{t.label}</span>;
}

// A listing card for the board feed. Links to the detail page at /board/:id.
export default function ListingCard({ listing }) {
  const t = TYPE_STYLES[listing.listing_type] || { rail: "#3a3a4f" };
  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const deadline = listing.deadline
    ? new Date(listing.deadline).toLocaleDateString()
    : null;

  return (
    <Link to={`/board/${listing.id}`} className="block">
      <div
        className="card card-interactive group relative h-full overflow-hidden border-l-2"
        style={{ borderLeftColor: t.rail }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-semibold text-white group-hover:text-wave-400">
            {listing.title}
          </h3>
          <div className="shrink-0">
            <ListingTypeBadge type={listing.listing_type} />
          </div>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {location || "Location not set"}
          {listing.author_username && (
            <>
              {" · by "}
              <span className="text-slate-400">@{listing.author_username}</span>
            </>
          )}
        </p>

        {listing.description && (
          <p className="mt-3 line-clamp-3 text-sm text-slate-400">
            {listing.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {listing.is_paid && (
            <span className="chip border-wave-500/40 text-wave-300">
              {listing.pay_description || "Paid"}
            </span>
          )}
          {deadline && (
            <span className="chip text-slate-400">Apply by {deadline}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
