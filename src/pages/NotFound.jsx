import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-extrabold text-wave-500">404</p>
      <h1 className="mt-3 text-xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-slate-400">
        That page drifted off the wave.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to discover
      </Link>
    </div>
  );
}
