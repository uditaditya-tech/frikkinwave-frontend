import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Discover from "./pages/Discover";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicProfile from "./pages/PublicProfile";
import EditProfile from "./pages/EditProfile";
import Requests from "./pages/Requests";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-800 py-6 text-center text-xs text-slate-600">
        frikkinwave · find your jam ·{" "}
        <a href="https://frikkinwave.com" className="hover:text-slate-400">
          frikkinwave.com
        </a>
      </footer>
    </div>
  );
}
