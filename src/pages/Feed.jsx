import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeed } from "../api/social";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

// Turns a feed activity into a verb phrase + a link to its target.
const VERB_PHRASE = {
  posted_listing: "posted a listing",
  created_band: "created a band",
};

function targetTo(entry) {
  if (entry.target_type === "listing") return `/board/${entry.target_id}`;
  if (entry.target_type === "band") return `/bands/${entry.target_slug}`;
  return null;
}

function FeedRow({ entry }) {
  const to = targetTo(entry);
  const phrase = VERB_PHRASE[entry.verb] || entry.verb;

  return (
    <div className="card">
      <p className="text-sm text-slate-300">
        <Link
          to={`/u/${entry.actor_username}`}
          className="font-semibold text-white hover:text-wave-400"
        >
          @{entry.actor_username}
        </Link>{" "}
        {phrase}
        {entry.summary && (
          <>
            {" — "}
            {to ? (
              <Link to={to} className="text-wave-400 hover:underline">
                {entry.summary}
              </Link>
            ) : (
              <span className="text-slate-200">{entry.summary}</span>
            )}
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {new Date(entry.created_at).toLocaleString()}
      </p>
    </div>
  );
}

export default function Feed() {
  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFeed();
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load your feed."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (!nextUrl) return;
    try {
      const data = await getFeed({ cursorUrl: nextUrl });
      setItems((prev) => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load more."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Feed</h1>
      <p className="mt-1 text-sm text-slate-400">
        What the musicians you follow have been up to — new listings and bands,
        newest first.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <Spinner label="Loading feed…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            Your feed is quiet. Follow musicians from{" "}
            <Link to="/" className="text-wave-400 hover:underline">
              Discover
            </Link>{" "}
            to see what they post.
          </div>
        ) : (
          items.map((entry) => <FeedRow key={entry.id} entry={entry} />)
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
