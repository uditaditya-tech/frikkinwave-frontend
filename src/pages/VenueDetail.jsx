import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteVenue, getVenue } from "../api/venues";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

export default function VenueDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVenue(slug)
      .then((v) => !cancelled && setVenue(v))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Venue not found.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isOwner = venue && user?.username && venue.owner_username === user.username;

  async function handleDelete() {
    if (!window.confirm("Take this venue down? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteVenue(slug);
      navigate("/venues");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't delete the venue."));
      setDeleting(false);
    }
  }

  if (loading) return <Spinner label="Loading venue…" />;

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-400">
          {error || "Venue not found."}
        </div>
        <div className="mt-4 text-center">
          <Link to="/venues" className="btn-ghost">
            Back to venues
          </Link>
        </div>
      </div>
    );
  }

  const location = [venue.city, venue.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/venues" className="text-sm text-slate-400 hover:text-wave-400">
        ← Back to venues
      </Link>

      <div className="card mt-3 border-l-2 border-amber-500/50">
        <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {location || "Location not set"}
          {venue.capacity ? ` · holds ${venue.capacity}` : ""}
          {venue.owner_username && (
            <>
              {" · listed by "}
              <Link
                to={`/u/${venue.owner_username}`}
                className="text-slate-300 hover:text-wave-400"
              >
                @{venue.owner_username}
              </Link>
            </>
          )}
        </p>

        {venue.description && (
          <p className="mt-4 whitespace-pre-line text-slate-300">
            {venue.description}
          </p>
        )}

        <dl className="mt-5 space-y-2 text-sm">
          {venue.address && (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-slate-500">Address</dt>
              <dd className="text-slate-300">{venue.address}</dd>
            </div>
          )}
          {venue.website && (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-slate-500">Website</dt>
              <dd>
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wave-400 underline hover:text-wave-300"
                >
                  {venue.website}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {isOwner && (
        <div className="mt-4 flex gap-2">
          <Link to={`/venues/${slug}/edit`} className="btn-ghost">
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? "Removing…" : "Take down"}
          </button>
        </div>
      )}
    </div>
  );
}
