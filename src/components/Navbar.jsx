import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navClass({ isActive }) {
  return [
    "rounded-md px-3 py-1.5 text-sm font-medium transition",
    isActive
      ? "bg-ink-800 text-white"
      : "text-slate-400 hover:text-white hover:bg-ink-800/60",
  ].join(" ");
}

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/wave.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            frikkin<span className="text-wave-500">wave</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <NavLink to="/" end className={navClass}>
            Discover
          </NavLink>
          <NavLink to="/board" className={navClass}>
            Board
          </NavLink>
          <NavLink to="/bands" className={navClass}>
            Bands
          </NavLink>
          <NavLink to="/venues" className={navClass}>
            Venues
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/requests" className={navClass}>
                Requests
              </NavLink>
              <NavLink to="/applications" className={navClass}>
                Applications
              </NavLink>
              <NavLink to="/band-invites" className={navClass}>
                Band invites
              </NavLink>
              <NavLink to="/engagements" className={navClass}>
                Engagements
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                My profile
              </NavLink>
              {user?.username && (
                <NavLink to={`/u/${user.username}`} className={navClass}>
                  @{user.username}
                </NavLink>
              )}
              <button onClick={handleSignOut} className="btn-ghost ml-1">
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                Log in
              </NavLink>
              <Link to="/register" className="btn-primary ml-1">
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
