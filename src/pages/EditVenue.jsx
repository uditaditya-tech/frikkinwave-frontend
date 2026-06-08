import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createVenue, getVenue, updateVenue } from "../api/venues";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

const EMPTY = {
  name: "",
  description: "",
  address: "",
  city: "",
  country: "",
  capacity: "",
  website: "",
};

export default function EditVenue() {
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
    getVenue(slug)
      .then((v) => {
        if (cancelled) return;
        // Guard: only the owner may edit. The API enforces this too (403/404).
        if (user?.username && v.owner_username !== user.username) {
          setError("You can only edit your own venue.");
          return;
        }
        setForm({
          name: v.name,
          description: v.description || "",
          address: v.address || "",
          city: v.city || "",
          country: v.country || "",
          capacity: v.capacity ?? "",
          website: v.website || "",
        });
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load the venue."));
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
      const saved = isEdit ? await updateVenue(slug, form) : await createVenue(form);
      navigate(`/venues/${saved.slug}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the venue."));
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading venue…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">
        {isEdit ? "Edit venue" : "List a venue"}
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Give your space a public page so musicians and bands can find it.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card mt-5 space-y-4">
        <div>
          <label className="label">Venue name</label>
          <input
            className="input"
            required
            maxLength={200}
            placeholder="e.g. The Backline Room"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[110px]"
            placeholder="The room, the gear, the vibe, how to book."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Address</label>
          <input
            className="input"
            maxLength={300}
            placeholder="Street address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Capacity (optional)</label>
            <input
              type="number"
              min={0}
              className="input"
              placeholder="e.g. 150"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Website (optional)</label>
            <input
              type="url"
              className="input"
              placeholder="https://…"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "List venue"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(isEdit ? `/venues/${slug}` : "/venues")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
