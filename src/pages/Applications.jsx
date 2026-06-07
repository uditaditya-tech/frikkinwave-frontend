import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptApplication,
  declineApplication,
  listApplications,
} from "../api/listings";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

const STATUS_STYLES = {
  pending: "border-amber-500/40 text-amber-300",
  accepted: "border-wave-500/40 text-wave-400",
  declined: "text-slate-500",
};

function ApplicationRow({ app, box, onAct, acting }) {
  const isPendingIncoming = box === "incoming" && app.status === "pending";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/board/${app.listing_id}`}
            className="text-base font-semibold text-white hover:text-wave-400"
          >
            {app.listing_title}
          </Link>
          <p className="text-xs text-slate-500">
            {box === "incoming" ? (
              <>
                from{" "}
                <Link
                  to={`/u/${app.applicant_username}`}
                  className="text-slate-400 hover:text-wave-400"
                >
                  @{app.applicant_username}
                </Link>
              </>
            ) : (
              "you applied"
            )}{" "}
            · {new Date(app.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`chip ${STATUS_STYLES[app.status] || ""}`}>
          {app.status}
        </span>
      </div>

      {app.message && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
          “{app.message}”
        </p>
      )}

      {app.status === "accepted" && app.contact_email && (
        <p className="mt-3 rounded-lg border border-wave-500/30 bg-wave-500/10 px-3 py-2 text-sm text-wave-200">
          Contact:{" "}
          <a href={`mailto:${app.contact_email}`} className="font-medium underline">
            {app.contact_email}
          </a>
        </p>
      )}

      {isPendingIncoming && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={acting}
            onClick={() => onAct("accept", app.id)}
            className="btn-primary"
          >
            Accept
          </button>
          <button
            disabled={acting}
            onClick={() => onAct("decline", app.id)}
            className="btn-ghost"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function Applications() {
  const [box, setBox] = useState("incoming");
  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listApplications({ box });
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load applications."));
    } finally {
      setLoading(false);
    }
  }, [box]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (!nextUrl) return;
    try {
      const data = await listApplications({ cursorUrl: nextUrl });
      setItems((prev) => [...prev, ...(data.results || [])]);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load more."));
    }
  }

  async function handleAct(action, id) {
    setActingId(id);
    setError("");
    try {
      const updated =
        action === "accept"
          ? await acceptApplication(id)
          : await declineApplication(id);
      setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't update the application."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Applications</h1>
      <p className="mt-1 text-sm text-slate-400">
        Incoming = people applying to your listings. Outgoing = listings you've
        applied to.
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
        {["incoming", "outgoing"].map((b) => (
          <button
            key={b}
            onClick={() => setBox(b)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              box === b ? "bg-wave-500 text-ink-950" : "text-slate-400 hover:text-white"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <Spinner label="Loading applications…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            {box === "incoming"
              ? "No one has applied to your listings yet."
              : "You haven't applied to any listings yet."}
          </div>
        ) : (
          items.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              box={box}
              acting={actingId === app.id}
              onAct={handleAct}
            />
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
