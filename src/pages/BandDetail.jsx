import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteBand, getBand, inviteMember } from "../api/bands";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

function InvitePanel({ slug }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function handleInvite(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSentTo("");
    try {
      await inviteMember(slug, { memberUsername: username.trim(), role });
      setSentTo(username.trim());
      setUsername("");
      setRole("");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the invite."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card mt-4 border-glow-500/30 bg-glow-500/5">
      <form onSubmit={handleInvite}>
        <label className="label">Invite a member</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="input"
            required
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            placeholder="role (optional) — e.g. Lead guitarist"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        {sentTo && (
          <p className="mt-2 text-sm text-wave-200">
            Invite sent to @{sentTo}. They'll see it under their band invites.
          </p>
        )}
        <button type="submit" className="btn-primary mt-3" disabled={sending}>
          {sending ? "Sending…" : "Send invite"}
        </button>
      </form>
    </div>
  );
}

export default function BandDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBand(slug)
      .then((b) => !cancelled && setBand(b))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Band not found.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isOwner = band && user?.username && band.owner_username === user.username;

  async function handleDelete() {
    if (!window.confirm("Disband this group? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteBand(slug);
      navigate("/bands");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't delete the band."));
      setDeleting(false);
    }
  }

  if (loading) return <Spinner label="Loading band…" />;

  if (error || !band) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center text-slate-400">
          {error || "Band not found."}
        </div>
        <div className="mt-4 text-center">
          <Link to="/bands" className="btn-ghost">
            Back to bands
          </Link>
        </div>
      </div>
    );
  }

  const location = [band.city, band.country].filter(Boolean).join(", ");
  const roster = band.members || [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/bands" className="text-sm text-slate-400 hover:text-wave-400">
        ← Back to bands
      </Link>

      <div className="card mt-3 border-l-2 border-glow-500/50">
        <h1 className="text-2xl font-bold text-white">{band.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {location || "Location not set"}
          {band.owner_username && (
            <>
              {" · led by "}
              <Link
                to={`/u/${band.owner_username}`}
                className="text-slate-300 hover:text-wave-400"
              >
                @{band.owner_username}
              </Link>
            </>
          )}
        </p>

        {band.bio && (
          <p className="mt-4 whitespace-pre-line text-slate-300">{band.bio}</p>
        )}

        <div className="mt-5">
          <h2 className="font-display text-xs uppercase tracking-wider text-slate-500">
            Lineup
          </h2>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center gap-2 text-sm">
              <Link
                to={`/u/${band.owner_username}`}
                className="font-medium text-white hover:text-wave-400"
              >
                @{band.owner_username}
              </Link>
              <span className="chip border-glow-500/40 text-glow-400">Owner</span>
            </li>
            {roster.map((m) => (
              <li key={m.member_username} className="flex items-center gap-2 text-sm">
                <Link
                  to={`/u/${m.member_username}`}
                  className="text-slate-200 hover:text-wave-400"
                >
                  @{m.member_username}
                </Link>
                {m.role && <span className="text-slate-500">· {m.role}</span>}
              </li>
            ))}
            {roster.length === 0 && (
              <li className="text-sm text-slate-500">
                No other members yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      {isOwner && (
        <>
          <div className="mt-4 flex gap-2">
            <Link to={`/bands/${slug}/edit`} className="btn-ghost">
              Edit
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? "Disbanding…" : "Disband"}
            </button>
          </div>
          <InvitePanel slug={slug} />
        </>
      )}
    </div>
  );
}
