import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCompatibility, getPublicProfile } from "../api/musicians";
import { sendRequest } from "../api/connections";
import { sendEngagement } from "../api/engagements";
import {
  followUser,
  listUserFollowers,
  listUserFollowing,
  unfollowUser,
} from "../api/social";
import { listReviews } from "../api/reviews";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import EqMeter from "../components/EqMeter";
import OnAir from "../components/OnAir";
import SoundEmbed from "../components/SoundEmbed";
import { genreHex } from "../lib/genreColors";

// "Why you might click" — an AI compatibility blurb between the viewer and this
// profile. Degrades quietly: renders nothing on 503 (AI unavailable) or any
// unexpected error; shows an actionable hint if the viewer has no profile yet.
function CompatibilityPanel({ username }) {
  const [state, setState] = useState({ status: "loading", blurb: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", blurb: "" });
    getCompatibility(username)
      .then((data) => {
        if (!cancelled) setState({ status: "ok", blurb: data.blurb });
      })
      .catch((err) => {
        if (cancelled) return;
        // 400 = viewer has no profile yet (actionable); everything else
        // (503 AI down, etc.) degrades to nothing.
        const code = err?.response?.status;
        setState({ status: code === 400 ? "needs-profile" : "hidden", blurb: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (state.status === "hidden") return null;

  return (
    <div className="card mt-6 border-glow-500/30 bg-glow-500/5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-glow-400">✦</span> Why you might click
      </h2>
      {state.status === "loading" && (
        <p className="mt-2 animate-pulse text-sm text-slate-500">
          Reading the room…
        </p>
      )}
      {state.status === "needs-profile" && (
        <p className="mt-2 text-sm text-slate-400">
          <Link to="/profile" className="text-glow-400 hover:underline">
            Create your profile
          </Link>{" "}
          to see how you two might click.
        </p>
      )}
      {state.status === "ok" && (
        <p className="mt-2 whitespace-pre-line text-sm text-slate-300">
          {state.blurb}
        </p>
      )}
    </div>
  );
}

function ContactPanel({ username }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [sending, setSending] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: "idle", text: "" });
    try {
      await sendRequest({ recipientUsername: username, message });
      setStatus({
        type: "ok",
        text: "Request sent! You'll see their contact details once they accept.",
      });
      setMessage("");
    } catch (err) {
      setStatus({ type: "error", text: apiErrorMessage(err, "Couldn't send request.") });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="card mt-6">
      <h2 className="text-lg font-semibold text-white">Send a contact request</h2>
      <p className="mt-1 text-sm text-slate-400">
        Introduce yourself. If they accept, you'll both see each other's email.
      </p>
      <textarea
        className="input mt-3 min-h-[90px] resize-y"
        placeholder="Hey! I play bass and I'm looking to jam on weekends…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {status.text && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            status.type === "ok"
              ? "border border-wave-500/30 bg-wave-500/10 text-wave-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {status.text}
        </p>
      )}
      <button type="submit" disabled={sending} className="btn-primary mt-4">
        {sending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

// Hire-for-a-session form — shown for musicians open to session work. Sends an
// EngagementRequest; on accept the musician's contact is revealed under Engagements.
function HirePanel({ username, rate }) {
  const [form, setForm] = useState({ message: "", proposedDate: "", rateOffer: "" });
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [sending, setSending] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: "idle", text: "" });
    try {
      await sendEngagement({
        musicianUsername: username,
        message: form.message,
        proposedDate: form.proposedDate,
        rateOffer: form.rateOffer,
      });
      setStatus({
        type: "ok",
        text: "Hire request sent. You'll see their contact once they accept.",
      });
      setForm({ message: "", proposedDate: "", rateOffer: "" });
    } catch (err) {
      setStatus({ type: "error", text: apiErrorMessage(err, "Couldn't send hire request.") });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="card mt-6 border-glow-500/30 bg-glow-500/5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-glow-400">✦</span> Hire for a session
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Open to paid session work{rate ? ` · ${rate}` : ""}. Send the details — if
        they accept, you'll both see each other's email.
      </p>
      <textarea
        className="input mt-3 min-h-[80px] resize-y"
        placeholder="What's the session — when, where, what you need…"
        value={form.message}
        onChange={(e) => set("message", e.target.value)}
      />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="label">Proposed date (optional)</label>
          <input
            type="date"
            className="input"
            value={form.proposedDate}
            onChange={(e) => set("proposedDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Your offer (optional)</label>
          <input
            className="input"
            maxLength={200}
            placeholder="e.g. ₹5000"
            value={form.rateOffer}
            onChange={(e) => set("rateOffer", e.target.value)}
          />
        </div>
      </div>
      {status.text && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            status.type === "ok"
              ? "border border-wave-500/30 bg-wave-500/10 text-wave-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {status.text}
        </p>
      )}
      <button type="submit" disabled={sending} className="btn-primary mt-4">
        {sending ? "Sending…" : "Send hire request"}
      </button>
    </form>
  );
}

// A 1–5 star row (filled ★ up to `value`, hollow ☆ after).
function Stars({ value }) {
  return (
    <span className="text-glow-400" aria-label={`${value} out of 5`}>
      {"★".repeat(value)}
      <span className="text-slate-600">{"☆".repeat(5 - value)}</span>
    </span>
  );
}

// Follower/following counts + a follow toggle. Counts and initial follow state
// come from the public follower/following lists. Cursor pagination has no total,
// so a count is shown as exact only when the list fits one page (else `N+`); the
// follow state is read from the first page of followers (known limitation: a
// viewer past page one would read as "not following" — see plan).
function FollowPanel({ username, viewerUsername, canFollow }) {
  const [followers, setFollowers] = useState({ count: 0, more: false });
  const [following, setFollowing] = useState({ count: 0, more: false });
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listUserFollowers(username), listUserFollowing(username)])
      .then(([fr, fg]) => {
        if (cancelled) return;
        const frRows = fr.results || [];
        setFollowers({ count: frRows.length, more: Boolean(fr.next) });
        setFollowing({ count: (fg.results || []).length, more: Boolean(fg.next) });
        if (viewerUsername) {
          setIsFollowing(frRows.some((r) => r.username === viewerUsername));
        }
      })
      .catch(() => {
        /* counts are non-critical — leave at zero on error */
      });
    return () => {
      cancelled = true;
    };
  }, [username, viewerUsername]);

  async function toggle() {
    const next = !isFollowing;
    setBusy(true);
    setIsFollowing(next);
    setFollowers((f) => ({ ...f, count: f.count + (next ? 1 : -1) }));
    try {
      await (next ? followUser(username) : unfollowUser(username));
    } catch {
      // revert on failure
      setIsFollowing(!next);
      setFollowers((f) => ({ ...f, count: f.count + (next ? -1 : 1) }));
    } finally {
      setBusy(false);
    }
  }

  const fmt = (c) => (c.more ? `${c.count}+` : c.count);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Link to={`/u/${username}/followers`} className="text-sm text-slate-300 hover:text-white">
        <span className="font-semibold text-white">{fmt(followers)}</span> followers
      </Link>
      <Link to={`/u/${username}/following`} className="text-sm text-slate-300 hover:text-white">
        <span className="font-semibold text-white">{fmt(following)}</span> following
      </Link>
      {canFollow && (
        <button
          onClick={toggle}
          disabled={busy}
          className={isFollowing ? "btn-ghost" : "btn-primary"}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

// Reviews this musician has received (public). Each is gated server-side on a
// completed engagement, so anything shown here is from a real working relationship.
function ReviewsCard({ username }) {
  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listReviews(username)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results || []);
        setNextUrl(data.next || null);
      })
      .catch(() => {
        /* reviews are non-critical — hide on error */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  async function loadMore() {
    if (!nextUrl) return;
    const data = await listReviews(username, { cursorUrl: nextUrl });
    setItems((prev) => [...prev, ...(data.results || [])]);
    setNextUrl(data.next || null);
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-semibold text-white">Reviews</h2>
      <div className="mt-3 space-y-3">
        {items.map((r) => (
          <div key={r.id} className="border-t border-ink-800 pt-3 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/u/${r.author_username}`}
                className="text-sm font-semibold text-white hover:text-wave-400"
              >
                @{r.author_username}
              </Link>
              <Stars value={r.rating} />
            </div>
            {r.comment && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{r.comment}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {nextUrl && (
          <button onClick={loadMore} className="btn-ghost">
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPublicProfile(username)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "No musician found with that handle."
              : apiErrorMessage(e, "Couldn't load this profile.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) return <Spinner label="Loading profile…" />;

  if (error) {
    return (
      <div className="card text-center">
        <p className="text-slate-300">{error}</p>
        <Link to="/" className="btn-ghost mt-4">
          Back to discover
        </Link>
      </div>
    );
  }

  const instruments = profile.instruments || [];
  const genres = profile.genres || [];
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const isSelf = user?.username && user.username === profile.username;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">@{profile.username}</h1>
            <p className="mt-1 text-slate-400">{location || "Location not set"}</p>
          </div>
          <OnAir
            available={profile.is_available}
            label="Available to jam"
            className="shrink-0"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {profile.is_open_to_session_work && (
            <span className="chip border-glow-500/40 text-glow-400">
              ✦ Open to session work
              {profile.session_rate ? ` · ${profile.session_rate}` : ""}
            </span>
          )}
          {profile.rating?.count > 0 && (
            <span className="chip border-glow-500/40 text-glow-300">
              ★ {profile.rating.average_rating} · {profile.rating.count}{" "}
              review{profile.rating.count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <FollowPanel
          username={profile.username}
          viewerUsername={user?.username}
          canFollow={isAuthenticated && !isSelf}
        />

        {profile.bio && (
          <p className="mt-4 whitespace-pre-line text-slate-300">{profile.bio}</p>
        )}

        {profile.sound_url && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Listen
            </h3>
            <SoundEmbed url={profile.sound_url} />
          </div>
        )}

        {instruments.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Instruments
            </h3>
            <div className="flex flex-wrap gap-2">
              {instruments.map((mi) => (
                <span
                  key={mi.instrument.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-sm text-slate-200"
                >
                  <EqMeter proficiency={mi.proficiency} />
                  {mi.instrument.name}
                  <span className="text-xs text-slate-500">{mi.proficiency}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {genres.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const c = genreHex(g.name);
                return (
                  <span
                    key={g.id}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{ borderColor: `${c}55`, color: c }}
                  >
                    {g.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {isSelf && (
          <Link to="/profile" className="btn-ghost mt-6">
            Edit my profile
          </Link>
        )}
      </div>

      {/* AI compatibility + contact: only for other authenticated users. */}
      {isAuthenticated && !isSelf && (
        <>
          <CompatibilityPanel username={profile.username} />
          {profile.is_open_to_session_work && (
            <HirePanel username={profile.username} rate={profile.session_rate} />
          )}
          <ContactPanel username={profile.username} />
        </>
      )}
      {!isAuthenticated && (
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="text-wave-400 hover:underline">
            Log in
          </Link>{" "}
          to send a contact request.
        </p>
      )}

      <ReviewsCard username={profile.username} />
    </div>
  );
}
