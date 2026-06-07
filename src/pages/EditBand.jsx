import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createBand, getBand, updateBand } from "../api/bands";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

const EMPTY = { name: "", bio: "", city: "", country: "" };

export default function EditBand() {
  const { slug } = useParams(); // present when editing
  const isEdit = Boolean(slug);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    getBand(slug)
      .then((b) => {
        if (cancelled) return;
        // Guard: only the owner may edit. The API enforces this too (403/404).
        if (user?.username && b.owner_username !== user.username) {
          setError("You can only edit your own band.");
          return;
        }
        setForm({
          name: b.name,
          bio: b.bio || "",
          city: b.city || "",
          country: b.country || "",
        });
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load the band."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isEdit, user]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = isEdit ? await updateBand(slug, form) : await createBand(form);
      navigate(`/bands/${saved.slug}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the band."));
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading band…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">
        {isEdit ? "Edit band" : "Start a band"}
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Give your group a page, then invite members by username.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card mt-5 space-y-4">
        <div>
          <label className="label">Band name</label>
          <input
            className="input"
            required
            maxLength={200}
            placeholder="e.g. The Midnight Set"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[120px]"
            placeholder="Your sound, who you're after, where you play."
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              maxLength={100}
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              className="input"
              maxLength={100}
              placeholder="e.g. India"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create band"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(isEdit ? `/bands/${slug}` : "/bands")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
