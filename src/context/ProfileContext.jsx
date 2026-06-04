/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthIdentity,
  getProfile,
  normalizePhoneNumber,
  upsertProfile,
} from "../services/profileService";

const ProfileContext = createContext(null);

export function getProfileDisplayName(profile, user) {
  const authIdentity = getAuthIdentity(user);
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    [authIdentity.firstName, authIdentity.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Readiora user"
  );
}

export function getProfileInitials(profile, user) {
  const displayName = getProfileDisplayName(profile, user);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "XU";
}

export function ProfileProvider({ user, children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError("");
      const profileRow = await getProfile(user);
      setProfile(profileRow);
      return profileRow;
    } catch (profileError) {
      setError(profileError.message);
      throw profileError;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!user) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        const profileRow = await getProfile(user);

        if (isMounted) {
          setProfile(profileRow);
        }
      } catch (profileError) {
        if (isMounted) {
          setError(profileError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveProfile = useCallback(
    async ({ firstName, lastName, avatarUrl, phone }) => {
      const nextPhone = normalizePhoneNumber(phone || "");

      const updatedProfile = await upsertProfile(user, {
        firstName,
        lastName,
        avatarUrl,
        phone: nextPhone,
      });

      setProfile(updatedProfile);
      return updatedProfile;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      reloadProfile: loadProfile,
      saveProfile,
      displayName: getProfileDisplayName(profile, user),
      initials: getProfileInitials(profile, user),
      avatarUrl: profile?.avatar_url || getAuthIdentity(user).avatarUrl,
    }),
    [error, loadProfile, loading, profile, saveProfile, user],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider.");
  }

  return context;
}
