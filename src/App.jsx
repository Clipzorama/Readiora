import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";

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

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected app routes */}
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
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
