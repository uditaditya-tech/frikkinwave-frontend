import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Discover from "./pages/Discover";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicProfile from "./pages/PublicProfile";
import EditProfile from "./pages/EditProfile";
import Requests from "./pages/Requests";
import Board from "./pages/Board";
import ListingDetail from "./pages/ListingDetail";
import PostListing from "./pages/PostListing";
import Applications from "./pages/Applications";
import Bands from "./pages/Bands";
import BandDetail from "./pages/BandDetail";
import EditBand from "./pages/EditBand";
import BandInvites from "./pages/BandInvites";
import Engagements from "./pages/Engagements";
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
          <Route path="/board" element={<Board />} />
          <Route
            path="/board/new"
            element={
              <ProtectedRoute>
                <PostListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/board/:id/edit"
            element={
              <ProtectedRoute>
                <PostListing />
              </ProtectedRoute>
            }
          />
          <Route path="/board/:id" element={<ListingDetail />} />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route path="/bands" element={<Bands />} />
          <Route
            path="/bands/new"
            element={
              <ProtectedRoute>
                <EditBand />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bands/:slug/edit"
            element={
              <ProtectedRoute>
                <EditBand />
              </ProtectedRoute>
            }
          />
          <Route path="/bands/:slug" element={<BandDetail />} />
          <Route
            path="/band-invites"
            element={
              <ProtectedRoute>
                <BandInvites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engagements"
            element={
              <ProtectedRoute>
                <Engagements />
              </ProtectedRoute>
            }
          />
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
