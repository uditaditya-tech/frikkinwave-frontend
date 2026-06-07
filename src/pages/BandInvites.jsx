import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptMembership,
  declineMembership,
  listMyMemberships,
} from "../api/bands";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

const STATUS_STYLES = {
  pending: "border-amber-500/40 text-amber-300",
  accepted: "border-wave-500/40 text-wave-400",
  declined: "text-slate-500",
};

function InviteRow({ m, onAct, acting }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/bands/${m.band_slug}`}
            className="text-base font-semibold text-white hover:text-wave-400"
          >
            {m.band_name}
          </Link>
          <p className="text-xs text-slate-500">
            invited you{m.role ? ` as ${m.role}` : ""} ·{" "}
            {new Date(m.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`chip ${STATUS_STYLES[m.status] || ""}`}>{m.status}</span>
      </div>

      {m.status === "accepted" && m.contact_email && (
        <p className="mt-3 rounded-lg border border-wave-500/30 bg-wave-500/10 px-3 py-2 text-sm text-wave-200">
          Contact:{" "}
          <a href={`mailto:${m.contact_email}`} className="font-medium underline">
            {m.contact_email}
          </a>
        </p>
      )}

      {m.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={acting}
            onClick={() => onAct("accept", m.id)}
            className="btn-primary"
          >
            Accept
          </button>
          <button
            disabled={acting}
            onClick={() => onAct("decline", m.id)}
            className="btn-ghost"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function BandInvites() {
  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyMemberships();
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load invites."));
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
      const data = await listMyMemberships({ cursorUrl: nextUrl });
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
          ? await acceptMembership(id)
          : await declineMembership(id);
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't update the invite."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Band invites</h1>
      <p className="mt-1 text-sm text-slate-400">
        Invitations to join bands. Accept to reveal the band owner's contact.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <Spinner label="Loading invites…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            No band invites yet.
          </div>
        ) : (
          items.map((m) => (
            <InviteRow
              key={m.id}
              m={m}
              acting={actingId === m.id}
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
