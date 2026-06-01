import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createMyProfile,
  getMyProfile,
  listGenres,
  listInstruments,
  updateMyProfile,
} from "../api/musicians";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

const PROFICIENCIES = ["beginner", "intermediate", "advanced"];

const EMPTY_FORM = {
  bio: "",
  city: "",
  country: "",
  isAvailable: true,
  instruments: [], // [{ instrumentId, proficiency }]
  genres: [], // [id, ...]
};

export default function EditProfile() {
  const { user } = useAuth();

  const [instruments, setInstruments] = useState([]);
  const [genres, setGenres] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isNew, setIsNew] = useState(false); // create vs update
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ins, gen] = await Promise.all([listInstruments(), listGenres()]);
        if (cancelled) return;
        setInstruments(ins);
        setGenres(gen);
      } catch {
        /* pickers may be empty; surface only profile-load errors */
      }

      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        setForm({
          bio: profile.bio || "",
          city: profile.city || "",
          country: profile.country || "",
          isAvailable: profile.is_available,
          instruments: (profile.instruments || []).map((mi) => ({
            instrumentId: mi.instrument.id,
            proficiency: mi.proficiency,
          })),
          genres: (profile.genres || []).map((g) => g.id),
        });
        setIsNew(false);
      } catch (e) {
        if (cancelled) return;
        if (e?.response?.status === 404) {
          setIsNew(true); // no profile yet — create mode
        } else {
          setError(apiErrorMessage(e, "Couldn't load your profile."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function addInstrument() {
    // Default to the first instrument not already chosen.
    const used = new Set(form.instruments.map((i) => i.instrumentId));
    const next = instruments.find((i) => !used.has(i.id));
    if (!next) return;
    setForm((f) => ({
      ...f,
      instruments: [
        ...f.instruments,
        { instrumentId: next.id, proficiency: "intermediate" },
      ],
    }));
  }

  function updateInstrument(idx, patch) {
    setForm((f) => ({
      ...f,
      instruments: f.instruments.map((row, i) =>
        i === idx ? { ...row, ...patch } : row
      ),
    }));
  }

  function removeInstrument(idx) {
    setForm((f) => ({
      ...f,
      instruments: f.instruments.filter((_, i) => i !== idx),
    }));
  }

  function toggleGenre(id) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(id)
        ? f.genres.filter((g) => g !== id)
        : [...f.genres, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSavedAt(null);

    // Guard: no duplicate instruments (backend rejects this too).
    const ids = form.instruments.map((i) => i.instrumentId);
    if (new Set(ids).size !== ids.length) {
      setError("You've listed the same instrument twice.");
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await createMyProfile(form);
        setIsNew(false);
      } else {
        await updateMyProfile(form);
      }
      setSavedAt(Date.now());
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading your profile…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "Set up your profile" : "Edit your profile"}
          </h1>
          {user?.username && (
            <p className="mt-1 text-sm text-slate-400">
              Public at{" "}
              <Link to={`/u/${user.username}`} className="text-wave-400 hover:underline">
                /u/{user.username}
              </Link>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-[110px] resize-y"
              placeholder="What do you play, what are you looking for, what are you into?"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">City</label>
              <input
                className="input"
                maxLength={100}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                className="input"
                maxLength={100}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="accent-wave-500"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm({ ...form, isAvailable: e.target.checked })
              }
            />
            I'm available to jam / collaborate
          </label>
        </div>

        {/* Instruments */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Instruments</h2>
            <button
              type="button"
              onClick={addInstrument}
              disabled={form.instruments.length >= instruments.length}
              className="btn-ghost"
            >
              + Add
            </button>
          </div>
          {form.instruments.length === 0 ? (
            <p className="text-sm text-slate-500">No instruments added yet.</p>
          ) : (
            <div className="space-y-2">
              {form.instruments.map((row, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    className="input flex-1"
                    value={row.instrumentId}
                    onChange={(e) =>
                      updateInstrument(idx, { instrumentId: e.target.value })
                    }
                  >
                    {instruments.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input w-40"
                    value={row.proficiency}
                    onChange={(e) =>
                      updateInstrument(idx, { proficiency: e.target.value })
                    }
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p[0].toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeInstrument(idx)}
                    className="btn-danger"
                    aria-label="Remove instrument"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-white">Genres</h2>
          {genres.length === 0 ? (
            <p className="text-sm text-slate-500">No genres available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const active = form.genres.includes(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`chip cursor-pointer ${
                      active
                        ? "border-wave-500 bg-wave-500/15 text-wave-300"
                        : "hover:border-slate-500"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
        {savedAt && (
          <p className="rounded-lg border border-wave-500/30 bg-wave-500/10 px-4 py-2 text-sm text-wave-300">
            Profile saved.
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : isNew ? "Create profile" : "Save changes"}
          </button>
          {user?.username && !isNew && (
            <Link to={`/u/${user.username}`} className="btn-ghost">
              View public profile
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
