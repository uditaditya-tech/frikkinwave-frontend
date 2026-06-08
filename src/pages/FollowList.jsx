import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { listUserFollowers, listUserFollowing } from "../api/social";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

// One component for both /u/:username/followers and /u/:username/following —
// the trailing path segment selects which edge of the follow graph to list.
export default function FollowList() {
  const { username } = useParams();
  const { pathname } = useLocation();
  const mode = pathname.endsWith("/following") ? "following" : "followers";
  const fetcher = mode === "following" ? listUserFollowing : listUserFollowers;

  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetcher(username);
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load this list."));
    } finally {
      setLoading(false);
    }
  }, [fetcher, username]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (!nextUrl) return;
    try {
      const data = await fetcher(username, { cursorUrl: nextUrl });
      setItems((prev) => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load more."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/u/${username}`} className="text-sm text-wave-400 hover:underline">
        ← @{username}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white">
        {mode === "following" ? "Following" : "Followers"}
      </h1>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-2">
        {loading ? (
          <Spinner label="Loading…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            {mode === "following"
              ? `@${username} isn't following anyone yet.`
              : `@${username} has no followers yet.`}
          </div>
        ) : (
          items.map((row) => (
            <Link
              key={row.username}
              to={`/u/${row.username}`}
              className="card flex items-center justify-between hover:border-wave-500/40"
            >
              <span className="font-semibold text-white">@{row.username}</span>
              <span className="text-xs text-slate-500">
                {new Date(row.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))
        )}

        {!loading && nextUrl && (
          <div className="flex justify-center">
            <button onClick={loadMore} className="btn-ghost">
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
