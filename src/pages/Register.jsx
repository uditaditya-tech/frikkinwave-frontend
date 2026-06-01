import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(form);
      // Land on profile setup so new users build a profile right away.
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold text-white">Join frikkinwave</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create an account to build your profile and connect.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              className="input"
              value={form.email}
              onChange={update("email")}
            />
          </div>
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              autoComplete="username"
              required
              pattern="[-a-zA-Z0-9_]+"
              title="Letters, numbers, hyphens and underscores only"
              className="input"
              placeholder="your-handle"
              value={form.username}
              onChange={update("username")}
            />
            <p className="mt-1 text-xs text-slate-500">
              Your public handle: frikkinwave.com/u/{form.username || "your-handle"}
            </p>
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="input"
              value={form.password}
              onChange={update("password")}
            />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              className="input"
              value={form.passwordConfirm}
              onChange={update("passwordConfirm")}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-wave-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
