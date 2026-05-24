import { supabase } from "../lib/supabase";

export const AVATARS_BUCKET = "avatars";
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_AVATAR_SIZE_LABEL = "2MB";

const SUPPORTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const COUNTRY_CALLING_CODES = [
  { code: "+39", country: "Italy", iso: "IT" },
  { code: "+1", country: "United States", iso: "US" },
  { code: "+44", country: "United Kingdom", iso: "GB" },
  { code: "+33", country: "France", iso: "FR" },
  { code: "+49", country: "Germany", iso: "DE" },
  { code: "+34", country: "Spain", iso: "ES" },
  { code: "+31", country: "Netherlands", iso: "NL" },
  { code: "+41", country: "Switzerland", iso: "CH" },
  { code: "+43", country: "Austria", iso: "AT" },
  { code: "+32", country: "Belgium", iso: "BE" },
  { code: "+351", country: "Portugal", iso: "PT" },
  { code: "+353", country: "Ireland", iso: "IE" },
  { code: "+45", country: "Denmark", iso: "DK" },
  { code: "+46", country: "Sweden", iso: "SE" },
  { code: "+47", country: "Norway", iso: "NO" },
  { code: "+358", country: "Finland", iso: "FI" },
  { code: "+48", country: "Poland", iso: "PL" },
  { code: "+30", country: "Greece", iso: "GR" },
  { code: "+27", country: "South Africa", iso: "ZA" },
  { code: "+61", country: "Australia", iso: "AU" },
  { code: "+64", country: "New Zealand", iso: "NZ" },
  { code: "+91", country: "India", iso: "IN" },
  { code: "+81", country: "Japan", iso: "JP" },
  { code: "+82", country: "South Korea", iso: "KR" },
  { code: "+55", country: "Brazil", iso: "BR" },
  { code: "+52", country: "Mexico", iso: "MX" },
];

function getAvatarExtension(file) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();
  const extensionFromType = file.type.split("/")[1]?.toLowerCase();
  const extension = extensionFromName || extensionFromType || "png";

  return extension === "jpeg" ? "jpg" : extension;
}

export function validateAvatarFile(file) {
  if (!file) return;

  if (!SUPPORTED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, and GIF avatar images are supported.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error(`Avatar image must be ${MAX_AVATAR_SIZE_LABEL} or smaller.`);
  }
}

export function getAuthIdentity(user) {
  const metadata = user?.user_metadata ?? {};

  return {
    firstName: metadata.first_name || "",
    lastName: metadata.last_name || "",
    avatarUrl: metadata.avatar_url || metadata.picture || "",
    phone: user?.phone || metadata.phone || "",
    email: user?.email || "",
  };
}

export function normalizePhoneNumber(value = "") {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!compact) return "";

  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }

  return compact;
}

export function sanitizePhoneDigits(value = "") {
  return value.replace(/\D/g, "");
}

export function buildInternationalPhoneNumber(countryCode, nationalNumber) {
  const code = normalizePhoneNumber(countryCode);
  const digits = sanitizePhoneDigits(nationalNumber);

  if (!digits) return "";

  return `${code}${digits}`;
}

export function parseInternationalPhoneNumber(value = "") {
  const normalized = normalizePhoneNumber(value);

  if (!normalized) {
    return {
      countryCode: COUNTRY_CALLING_CODES[0].code,
      nationalNumber: "",
    };
  }

  const country = [...COUNTRY_CALLING_CODES]
    .sort((first, second) => second.code.length - first.code.length)
    .find((item) => normalized.startsWith(item.code));

  if (!country) {
    return {
      countryCode: COUNTRY_CALLING_CODES[0].code,
      nationalNumber: sanitizePhoneDigits(normalized),
    };
  }

  return {
    countryCode: country.code,
    nationalNumber: sanitizePhoneDigits(normalized.slice(country.code.length)),
  };
}

export function isValidInternationalPhone(value = "") {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return true;

  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function mergeProfileWithAuth(profile, user) {
  const authIdentity = getAuthIdentity(user);

  return {
    id: user.id,
    first_name: profile?.first_name ?? authIdentity.firstName,
    last_name: profile?.last_name ?? authIdentity.lastName,
    avatar_url: profile?.avatar_url ?? authIdentity.avatarUrl,
    phone: profile?.phone ?? authIdentity.phone,
    created_at: profile?.created_at ?? null,
  };
}

export async function getProfile(user) {
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, phone, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return mergeProfileWithAuth(data, user);
  }

  return upsertProfile(user, getAuthIdentity(user));
}

export async function upsertProfile(user, profile) {
  if (!user?.id) {
    throw new Error("You must be signed in to update your profile.");
  }

  const payload = {
    id: user.id,
    first_name: profile.firstName?.trim() || null,
    last_name: profile.lastName?.trim() || null,
    avatar_url: profile.avatarUrl?.trim() || null,
    phone: profile.phone ? normalizePhoneNumber(profile.phone) : null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, first_name, last_name, avatar_url, phone, created_at")
    .single();

  if (error) throw error;
  return mergeProfileWithAuth(data, user);
}

export async function uploadAvatar({ user, file }) {
  if (!user?.id) {
    throw new Error("You must be signed in to upload an avatar.");
  }

  validateAvatarFile(file);

  const extension = getAvatarExtension(file);
  const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function updateAuthPhone(phone) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return null;

  const { data, error } = await supabase.auth.updateUser({
    phone: normalizedPhone,
  });

  if (error) throw error;
  return data.user;
}
