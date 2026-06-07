import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createListing,
  getListing,
  LISTING_TYPES,
  updateListing,
} from "../api/listings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

const EMPTY = {
  listingType: "gig",
  title: "",
  description: "",
  city: "",
  country: "",
  isPaid: false,
  payDescription: "",
  deadline: "",
};

export default function PostListing() {
  const { id } = useParams(); // present when editing
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // When editing, hydrate the form from the existing listing.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    getListing(id)
      .then((l) => {
        if (cancelled) return;
        // Guard: only the author may edit. The API enforces this too (403).
        if (user?.username && l.author_username !== user.username) {
          setError("You can only edit your own listings.");
          return;
        }
        setForm({
          listingType: l.listing_type,
          title: l.title,
          description: l.description,
          city: l.city,
          country: l.country,
          isPaid: l.is_paid,
          payDescription: l.pay_description || "",
          deadline: l.deadline || "",
        });
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Couldn't load the listing."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, user]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = isEdit
        ? await updateListing(id, form)
        : await createListing(form);
      navigate(`/board/${saved.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the listing."));
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading listing…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">
        {isEdit ? "Edit listing" : "Post a listing"}
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Looking for players, a venue, or running an audition? Put it on the board.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card mt-5 space-y-4">
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={form.listingType}
            onChange={(e) => set("listingType", e.target.value)}
          >
            {LISTING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Title</label>
          <input
            className="input"
            required
            maxLength={200}
            placeholder="e.g. Bassist wanted for indie rock band"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px]"
            required
            placeholder="The gig, what you're after, when and where, anything else worth knowing."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              required
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
              required
              maxLength={100}
              placeholder="e.g. India"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="accent-wave-500"
            checked={form.isPaid}
            onChange={(e) => set("isPaid", e.target.checked)}
          />
          This is a paid opportunity
        </label>

        {form.isPaid && (
          <div>
            <label className="label">Pay details</label>
            <input
              className="input"
              maxLength={200}
              placeholder="e.g. ₹2000 per show"
              value={form.payDescription}
              onChange={(e) => set("payDescription", e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="label">Apply-by deadline (optional)</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Post listing"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(isEdit ? `/board/${id}` : "/board")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
