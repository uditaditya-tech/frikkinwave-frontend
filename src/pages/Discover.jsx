import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listGenres,
  listInstruments,
  listProfiles,
  searchProfiles,
} from "../api/musicians";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ProfileCard from "../components/ProfileCard";
import Spinner from "../components/Spinner";

const EMPTY_FILTERS = {
  city: "",
  country: "",
  instrument: "",
  genre: "",
  available: false,
  openToSession: false,
};

export default function Discover() {
  const { isAuthenticated } = useAuth();

  const [instruments, setInstruments] = useState([]);
  const [genres, setGenres] = useState([]);

  // `filters` is the live form; `applied` is what's actually queried.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const [profiles, setProfiles] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Semantic search is a separate mode from the structured-filter browse feed.
  // `query` is the live input; `searched` is the query whose results are shown.
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchMode = searched !== "";

  // Load lookup tables once for the filter dropdowns.
  useEffect(() => {
    Promise.all([listInstruments(), listGenres()])
      .then(([ins, gen]) => {
        setInstruments(ins);
        setGenres(gen);
      })
      .catch(() => {
        /* dropdowns just stay empty; not fatal */
      });
  }, []);

  // (Re)load the feed whenever the applied filters change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = {
      city: applied.city,
      country: applied.country,
      instrument: applied.instrument,
      genre: applied.genre,
    };
    if (applied.available) params.available = "true";
    if (applied.openToSession) params.open_to_session = "true";

    listProfiles({ params })
      .then((data) => {
        if (cancelled) return;
        setProfiles(data.results || []);
        setNextUrl(data.next || null);
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load profiles."));
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
      const data = await listProfiles({ cursorUrl: nextUrl });
      setProfiles((prev) => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load more."));
    } finally {
      setLoadingMore(false);
    }
  }

  async function runSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const data = await searchProfiles({ q, available: applied.available });
      setResults(data.results || []);
      setSearched(q);
    } catch (err) {
      setSearchError(apiErrorMessage(err, "Search is unavailable right now."));
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearched("");
    setResults([]);
    setSearchError("");
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
      {/* Hero */}
      <section className="hero-spotlight relative mb-8 overflow-hidden rounded-2xl border border-ink-800 px-6 py-10 sm:px-8 sm:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Find your next{" "}
          <span className="bg-gradient-to-r from-wave-400 to-glow-400 bg-clip-text text-transparent">
            jam partner
          </span>
          .
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Musicians, by instrument, genre, and city. Build a profile, get
          discovered, and connect with players near you.
        </p>
        {!isAuthenticated && (
          <div className="mt-5 flex gap-3">
            <Link to="/register" className="btn-primary">
              Create your profile
            </Link>
            <Link to="/login" className="btn-ghost">
              Log in
            </Link>
          </div>
        )}

        {/* Semantic search — describe who you're after in plain language. */}
        <form onSubmit={runSearch} className="relative mt-6 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Describe who you're looking for — e.g. “a jazz drummer in Berlin into 70s fusion”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
          {searchMode && (
            <button type="button" onClick={clearSearch} className="btn-ghost">
              Clear
            </button>
          )}
        </form>
      </section>

      {/* Filters — hidden while a semantic search is active. */}
      {!searchMode && (
      <form
        onSubmit={applyFilters}
        className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
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
        <div>
          <label className="label">Instrument</label>
          <select
            className="input"
            value={filters.instrument}
            onChange={(e) =>
              setFilters({ ...filters, instrument: e.target.value })
            }
          >
            <option value="">Any</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Genre</label>
          <select
            className="input"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="">Any</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex h-[42px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm">
            <input
              type="checkbox"
              className="accent-wave-500"
              checked={filters.available}
              onChange={(e) =>
                setFilters({ ...filters, available: e.target.checked })
              }
            />
            Available only
          </label>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex h-[42px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm">
            <input
              type="checkbox"
              className="accent-glow-500"
              checked={filters.openToSession}
              onChange={(e) =>
                setFilters({ ...filters, openToSession: e.target.checked })
              }
            />
            Session work
          </label>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <button type="button" onClick={resetFilters} className="btn-ghost">
            Reset
          </button>
        </div>
      </form>
      )}

      {/* Search results take over the feed when a query is active. */}
      {searchMode ? (
        <>
          {searchError && (
            <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              {searchError}
            </p>
          )}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Semantic matches for{" "}
              <span className="text-slate-200">“{searched}”</span>
            </p>
            <button type="button" onClick={clearSearch} className="btn-ghost">
              Back to browse
            </button>
          </div>
          {searching ? (
            <Spinner label="Listening…" />
          ) : results.length === 0 ? (
            <div className="card text-center text-slate-400">
              No semantic matches — try rephrasing, or clear the search to browse.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </>
      ) : (
      <>
      {/* Results */}
      {error && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner label="Finding musicians…" />
      ) : profiles.length === 0 ? (
        <div className="card text-center text-slate-400">
          No musicians match these filters yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} />
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
      </>
      )}
    </div>
  );
}
