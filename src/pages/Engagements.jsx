import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptEngagement,
  completeEngagement,
  declineEngagement,
  listEngagements,
} from "../api/engagements";
import { createReview } from "../api/reviews";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";

// Inline review form shown on a completed engagement. The completed engagement is
// what authorises the review server-side, so its id gates the POST.
function ReviewForm({ subjectUsername, engagementId }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [saving, setSaving] = useState(false);

  if (status.type === "done") {
    return (
      <p className="mt-3 rounded-lg border border-glow-500/30 bg-glow-500/10 px-3 py-2 text-sm text-glow-200">
        Thanks — your review of @{subjectUsername} is posted.
      </p>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost mt-4">
        Leave a review
      </button>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "idle", text: "" });
    try {
      await createReview({ subjectUsername, engagementId, rating, comment });
      setStatus({ type: "done", text: "" });
    } catch (err) {
      setStatus({
        type: "error",
        text: apiErrorMessage(err, "Couldn't post your review."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-ink-700 bg-ink-900/60 p-3">
      <p className="text-sm font-medium text-white">Review @{subjectUsername}</p>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className={`text-2xl leading-none ${
              n <= rating ? "text-glow-400" : "text-slate-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input mt-3 min-h-[70px] resize-y"
        placeholder="How was working with them? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {status.text && (
        <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {status.text}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Posting…" : "Post review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

const STATUS_STYLES = {
  pending: "border-amber-500/40 text-amber-300",
  accepted: "border-wave-500/40 text-wave-400",
  declined: "text-slate-500",
  completed: "border-glow-500/40 text-glow-400",
};

function EngagementRow({ eng, box, onAct, acting }) {
  const other = box === "incoming" ? eng.requester_username : eng.musician_username;
  const isPendingIncoming = box === "incoming" && eng.status === "pending";
  // Either party may mark an accepted engagement complete.
  const canComplete = eng.status === "accepted";
  const proposed = eng.proposed_date
    ? new Date(eng.proposed_date).toLocaleDateString()
    : null;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/u/${other}`}
            className="text-base font-semibold text-white hover:text-wave-400"
          >
            @{other}
          </Link>
          <p className="text-xs text-slate-500">
            {box === "incoming" ? "wants to hire you" : "you reached out to hire"} ·{" "}
            {new Date(eng.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`chip ${STATUS_STYLES[eng.status] || ""}`}>
          {eng.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {proposed && <span className="chip text-slate-400">Date {proposed}</span>}
        {eng.rate_offer && (
          <span className="chip border-glow-500/40 text-glow-300">
            {eng.rate_offer}
          </span>
        )}
      </div>

      {eng.message && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
          “{eng.message}”
        </p>
      )}

      {(eng.status === "accepted" || eng.status === "completed") &&
        eng.contact_email && (
          <p className="mt-3 rounded-lg border border-wave-500/30 bg-wave-500/10 px-3 py-2 text-sm text-wave-200">
            Contact:{" "}
            <a href={`mailto:${eng.contact_email}`} className="font-medium underline">
              {eng.contact_email}
            </a>
          </p>
        )}

      {(isPendingIncoming || canComplete) && (
        <div className="mt-4 flex gap-2">
          {isPendingIncoming && (
            <>
              <button
                disabled={acting}
                onClick={() => onAct("accept", eng.id)}
                className="btn-primary"
              >
                Accept
              </button>
              <button
                disabled={acting}
                onClick={() => onAct("decline", eng.id)}
                className="btn-ghost"
              >
                Decline
              </button>
            </>
          )}
          {canComplete && (
            <button
              disabled={acting}
              onClick={() => onAct("complete", eng.id)}
              className="btn-ghost"
            >
              Mark complete
            </button>
          )}
        </div>
      )}

      {eng.status === "completed" && (
        <ReviewForm subjectUsername={other} engagementId={eng.id} />
      )}
    </div>
  );
}

export default function Engagements() {
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
      const data = await listEngagements({ box });
      setItems(data.results || []);
      setNextUrl(data.next || null);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't load engagements."));
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
      const data = await listEngagements({ cursorUrl: nextUrl });
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
      const fn =
        action === "accept"
          ? acceptEngagement
          : action === "decline"
            ? declineEngagement
            : completeEngagement;
      const updated = await fn(id);
      setItems((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't update the engagement."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Engagements</h1>
      <p className="mt-1 text-sm text-slate-400">
        Session-work hire requests. Incoming = people hiring you. Outgoing =
        musicians you've reached out to hire.
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
          <Spinner label="Loading engagements…" />
        ) : items.length === 0 ? (
          <div className="card text-center text-slate-400">
            {box === "incoming"
              ? "No one has tried to hire you yet."
              : "You haven't sent any hire requests yet."}
          </div>
        ) : (
          items.map((eng) => (
            <EngagementRow
              key={eng.id}
              eng={eng}
              box={box}
              acting={actingId === eng.id}
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
