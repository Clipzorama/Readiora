import { Navigate } from "react-router-dom";
import { ProfileProvider } from "../context/ProfileContext";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <ProfileProvider user={user}>{children}</ProfileProvider>;
}
