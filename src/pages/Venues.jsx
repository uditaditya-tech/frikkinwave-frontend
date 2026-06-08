import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import VenueCard from "../components/VenueCard";
import Spinner from "../components/Spinner";

const EMPTY_FILTERS = { city: "", country: "" };

export default function Venues() {
  const { isAuthenticated } = useAuth();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const [venues, setVenues] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listVenues({ params: applied })
      .then((data) => {
        if (cancelled) return;
        setVenues(data.results || []);
        setNextUrl(data.next || null);
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load venues."));
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
      const data = await listVenues({ cursorUrl: nextUrl });
      setVenues((prev) => [...prev, ...(data.results || [])]);
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
            Venues
          </h1>
          <p className="mt-1 text-slate-400">
            Clubs, bars, studios, and halls — find a place to play or list your own.
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/venues/new" className="btn-primary">
            List a venue
          </Link>
        )}
      </div>

      <form
        onSubmit={applyFilters}
        className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
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
        <Spinner label="Loading venues…" />
      ) : venues.length === 0 ? (
        <div className="card text-center text-slate-400">
          No venues match these filters yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} />
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
