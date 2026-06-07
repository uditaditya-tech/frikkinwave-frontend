import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LISTING_TYPES, listListings } from "../api/listings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ListingCard from "../components/ListingCard";
import Spinner from "../components/Spinner";

const EMPTY_FILTERS = { type: "", city: "", country: "" };

export default function Board() {
  const { isAuthenticated } = useAuth();

  // `filters` is the live form; `applied` is what's actually queried.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const [listings, setListings] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listListings({ params: applied })
      .then((data) => {
        if (cancelled) return;
        setListings(data.results || []);
        setNextUrl(data.next || null);
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load the board."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied]);

  async function loadMore() {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const data = await listListings({ cursorUrl: nextUrl });
      setListings((prev) => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load more."));
    } finally {
      setLoadingMore(false);
    }
  }

  function applyFilters(e) {
    e.preventDefault();
    setApplied(filters);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Gig &amp; audition board
          </h1>
          <p className="mt-1 text-slate-400">
            Gigs, auditions, and venues looking for players.
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/board/new" className="btn-primary">
            Post a listing
          </Link>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Any</option>
            {LISTING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">City</label>
          <input
            className="input"
            placeholder="e.g. Mumbai"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Country</label>
          <input
            className="input"
            placeholder="e.g. India"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1">
            Apply
          </button>
          <button type="button" onClick={resetFilters} className="btn-ghost">
            Reset
          </button>
        </div>
      </form>

      {error && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner label="Loading the board…" />
      ) : listings.length === 0 ? (
        <div className="card text-center text-slate-400">
          Nothing on the board matches these filters yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          {nextUrl && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-ghost"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
