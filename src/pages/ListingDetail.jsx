import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  applyToListing,
  deleteListing,
  getListing,
} from "../api/listings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ListingTypeBadge } from "../components/ListingCard";
import Spinner from "../components/Spinner";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Apply flow
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Author delete flow
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getListing(id)
      .then((l) => !cancelled && setListing(l))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Listing not found.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isAuthor =
    listing && user?.username && listing.author_username === user.username;

  async function handleApply(e) {
    e.preventDefault();
    setApplying(true);
    setApplyError("");
    try {
      await applyToListing(id, { message });
      setApplied(true);
    } catch (err) {
      setApplyError(apiErrorMessage(err, "Couldn't send your application."));
    } finally {
      setApplying(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Take this listing down? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteListing(id);
      navigate("/board");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't delete the listing."));
      setDeleting(false);
    }
  }

  if (loading) return <Spinner label="Loading listing…" />;

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-400">
          {error || "Listing not found."}
        </div>
        <div className="mt-4 text-center">
          <Link to="/board" className="btn-ghost">
            Back to the board
          </Link>
        </div>
      </div>
    );
  }

  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const deadline = listing.deadline
    ? new Date(listing.deadline).toLocaleDateString()
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/board" className="text-sm text-slate-400 hover:text-wave-400">
        ← Back to the board
      </Link>

      <div className="card mt-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
          <ListingTypeBadge type={listing.listing_type} />
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {location || "Location not set"}
          {listing.author_username && (
            <>
              {" · posted by "}
              <Link
                to={`/u/${listing.author_username}`}
                className="text-slate-300 hover:text-wave-400"
              >
                @{listing.author_username}
              </Link>
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {listing.is_paid && (
            <span className="chip border-wave-500/40 text-wave-300">
              {listing.pay_description || "Paid"}
            </span>
          )}
          {deadline && <span className="chip text-slate-400">Apply by {deadline}</span>}
        </div>

        <p className="mt-4 whitespace-pre-line text-slate-300">
          {listing.description}
        </p>
      </div>

      {/* Author controls */}
      {isAuthor && (
        <div className="mt-4 flex gap-2">
          <Link to={`/board/${id}/edit`} className="btn-ghost">
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? "Removing…" : "Take down"}
          </button>
          <Link to="/applications" className="btn-ghost ml-auto">
            View applications
          </Link>
        </div>
      )}

      {/* Apply panel — for signed-in non-authors */}
      {!isAuthor && (
        <div className="card mt-4 border-glow-500/30 bg-glow-500/5">
          {applied ? (
            <p className="text-sm text-wave-200">
              Application sent. You'll see it under{" "}
              <Link to="/applications" className="underline">
                your applications
              </Link>{" "}
              — the poster will be in touch if it's a fit.
            </p>
          ) : !isAuthenticated ? (
            <p className="text-sm text-slate-400">
              <Link to="/login" className="text-wave-400 underline">
                Log in
              </Link>{" "}
              to apply to this listing.
            </p>
          ) : (
            <form onSubmit={handleApply}>
              <label className="label">Apply to this listing</label>
              <textarea
                className="input min-h-[90px]"
                placeholder="Optional — say why you're a fit, link a track, etc."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {applyError && (
                <p className="mt-2 text-sm text-rose-300">{applyError}</p>
              )}
              <button type="submit" className="btn-primary mt-3" disabled={applying}>
                {applying ? "Sending…" : "Send application"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
