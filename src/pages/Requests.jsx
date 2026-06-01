import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptRequest,
  declineRequest,
  listRequests,
} from "../api/connections";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

const STATUS_STYLES = {
  pending: "border-amber-500/40 text-amber-300",
  accepted: "border-wave-500/40 text-wave-400",
  declined: "text-slate-500",
};

function RequestRow({ req, box, onAct, acting }) {
  const other = box === "incoming" ? req.sender_username : req.recipient_username;
  const isPendingIncoming = box === "incoming" && req.status === "pending";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to={`/u/${other}`}
            className="text-base font-semibold text-white hover:text-wave-400"
          >
            @{other}
          </Link>
          <p className="text-xs text-slate-500">
            {box === "incoming" ? "wants to connect" : "you reached out"} ·{" "}
            {new Date(req.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`chip ${STATUS_STYLES[req.status] || ""}`}>
          {req.status}
        </span>
      </div>

      {req.message && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
          “{req.message}”
        </p>
      )}

      {req.status === "accepted" && req.contact_email && (
        <p className="mt-3 rounded-lg border border-wave-500/30 bg-wave-500/10 px-3 py-2 text-sm text-wave-200">
          Contact:{" "}
          <a href={`mailto:${req.contact_email}`} className="font-medium underline">
            {req.contact_email}
          </a>
        </p>
      )}

      {isPendingIncoming && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={acting}
            onClick={() => onAct("accept", req.id)}
            className="btn-primary"
          >
            Accept
          </button>
          <button
            disabled={acting}
            onClick={() => onAct("decline", req.id)}
            className="btn-ghost"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function Requests() {
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
      const data = await listRequests({ box });
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load requests."));
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
      const data = await listRequests({ cursorUrl: nextUrl });
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
        action === "accept" ? await acceptRequest(id) : await declineRequest(id);
      // Replace the row in place with the server's updated version.
      setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't update the request."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Contact requests</h1>

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
          <Spinner label="Loading requests…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            {box === "incoming"
              ? "No incoming requests yet."
              : "You haven't sent any requests yet."}
          </div>
        ) : (
          items.map((req) => (
            <RequestRow
              key={req.id}
              req={req}
              box={box}
              acting={actingId === req.id}
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
