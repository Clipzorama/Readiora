import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Notes from "./pages/notes/Notes";
import Summaries from "./pages/Summaries";
import Flashcards from "./pages/Flashcards";

import ProtectedRoute from "./routes/ProtectedRoute";

const Landing = lazy(() => import("./pages/Landing"));

function LandingFallback() {
  return <main className="min-h-screen bg-background" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing route */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LandingFallback />}>
              <Landing />
            </Suspense>
          }
        />
        <Route
          path="/playform"
          element={
            <Suspense fallback={<LandingFallback />}>
              <Landing />
            </Suspense>
          }
        />

        {/* Authenticated Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected App Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/summaries"
          element={
            <ProtectedRoute>
              <Summaries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <Flashcards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
