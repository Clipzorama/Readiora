import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Save,
  ShieldCheck,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import {
  buildInternationalPhoneNumber,
  COUNTRY_CALLING_CODES,
  getAuthIdentity,
  isValidInternationalPhone,
  normalizePhoneNumber,
  parseInternationalPhoneNumber,
  sanitizePhoneDigits,
  uploadAvatar,
  validateAvatarFile,
} from "../services/profileService";
import { useAuth } from "../hooks/useAuth";
import UserAvatar from "./UserAvatar";

const fieldClass =
  "w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, helper, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-primary">{label}</span>
      {children}
      {helper && <span className="text-xs leading-5 text-muted">{helper}</span>}
    </label>
  );
}

export default function ProfileSettingsForm({ onSaved }) {
  const { user } = useAuth();
  const {
    profile,
    loading,
    error,
    saveProfile,
    avatarUrl,
    initials,
    displayName,
  } = useProfile();
  const authIdentity = useMemo(() => getAuthIdentity(user), [user]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
    phoneCountryCode: COUNTRY_CALLING_CODES[0].code,
    phoneNationalNumber: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const phoneParts = parseInternationalPhoneNumber(
      profile?.phone || authIdentity.phone || "",
    );

    setForm({
      firstName: profile?.first_name || authIdentity.firstName || "",
      lastName: profile?.last_name || authIdentity.lastName || "",
      avatarUrl: profile?.avatar_url || authIdentity.avatarUrl || "",
      phoneCountryCode: phoneParts.countryCode,
      phoneNationalNumber: phoneParts.nationalNumber,
    });
  }, [authIdentity, profile]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus({ type: "", message: "" });
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] ?? null;

    try {
      validateAvatarFile(file);
      setAvatarFile(file);
      setStatus({ type: "", message: "" });
    } catch (avatarError) {
      event.target.value = "";
      setAvatarFile(null);
      setStatus({ type: "error", message: avatarError.message });
    }
  }

  function updatePhoneCountry(value) {
    setForm((current) => ({ ...current, phoneCountryCode: value }));
    setStatus({ type: "", message: "" });
  }

  function updatePhoneNationalNumber(value) {
    setForm((current) => ({
      ...current,
      phoneNationalNumber: sanitizePhoneDigits(value),
    }));
    setStatus({ type: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const phone = buildInternationalPhoneNumber(
      form.phoneCountryCode,
      form.phoneNationalNumber,
    );

    if (!isValidInternationalPhone(phone)) {
      setStatus({
        type: "error",
        message: "Enter a valid phone number. Use only digits after the country code.",
      });
      return;
    }

    try {
      setSaving(true);
      setStatus({ type: "", message: "" });
      const uploadedAvatarUrl = avatarFile
        ? await uploadAvatar({ user, file: avatarFile })
        : form.avatarUrl;

      await saveProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        avatarUrl: uploadedAvatarUrl,
        phone: normalizePhoneNumber(phone),
      });
      setAvatarFile(null);
      setForm((current) => ({ ...current, avatarUrl: uploadedAvatarUrl }));
      setStatus({
        type: "success",
        message: "Profile settings saved.",
      });
      onSaved?.();
    } catch (saveError) {
      setStatus({
        type: "error",
        message: saveError.message,
      });
    } finally {
      setSaving(false);
    }
  }

  const previewPhone = buildInternationalPhoneNumber(
    form.phoneCountryCode,
    form.phoneNationalNumber,
  );
  const phoneHelper = previewPhone
    ? "Phone changes are sent through Supabase Auth and may require SMS verification."
    : "Optional. Choose a country code, then enter digits only.";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-5 rounded-[1.35rem] border border-border bg-background/55 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <UserAvatar
          avatarUrl={form.avatarUrl || avatarUrl}
          initials={initials}
          label={displayName}
          size="lg"
        />
        <div className="min-w-0">
          <p className="truncate text-xl font-bold text-primary">{displayName}</p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Profile details power your dashboard identity, sidebar account card,
            and workspace settings.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {status.message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={[
            "flex items-start gap-3 rounded-2xl border p-4 text-sm",
            status.type === "success"
              ? "border-success/40 bg-success/15 text-primary"
              : "border-danger/40 bg-danger/15 text-primary",
          ].join(" ")}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          )}
          <span>{status.message}</span>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First name">
          <input
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            className={fieldClass}
            placeholder="First name"
            autoComplete="given-name"
            disabled={loading || saving}
          />
        </Field>

        <Field label="Last name">
          <input
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            className={fieldClass}
            placeholder="Last name"
            autoComplete="family-name"
            disabled={loading || saving}
          />
        </Field>
      </div>

      <div className="grid gap-3">
        <span className="text-sm font-semibold text-primary">Avatar image</span>
        <div className="grid gap-4 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-strong-border/60 bg-button/20 text-primary">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary">
              <Upload className="h-4 w-4" />
              Choose image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="sr-only"
                disabled={loading || saving}
              />
            </label>
            <p className="mt-3 truncate text-sm text-secondary">
              {avatarFile ? avatarFile.name : "JPG, PNG, WEBP, or GIF up to 2MB."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-semibold text-primary">Phone number</span>
        <div className="grid gap-3 sm:grid-cols-[minmax(13rem,0.44fr)_1fr]">
          <div className="relative">
            <select
              value={form.phoneCountryCode}
              onChange={(event) => updatePhoneCountry(event.target.value)}
              className={`${fieldClass} appearance-none pr-14`}
              autoComplete="tel-country-code"
              disabled={loading || saving}
            >
              {COUNTRY_CALLING_CODES.map((country) => (
                <option key={`${country.iso}-${country.code}`} value={country.code}>
                  {country.code} {country.country}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          </div>
          <input
            value={form.phoneNationalNumber}
            onChange={(event) => updatePhoneNationalNumber(event.target.value)}
            className={fieldClass}
            placeholder="3331234567"
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            autoComplete="tel-national"
            disabled={loading || saving}
          />
        </div>
        <span className="text-xs leading-5 text-muted">
          {phoneHelper}
          {previewPhone ? ` Saved format: ${previewPhone}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/55 p-4 text-sm leading-6 text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          Only your signed-in account can read or update this profile row.
        </span>
        <motion.button
          type="submit"
          whileHover={{ y: saving ? 0 : -1, scale: saving ? 1 : 1.01 }}
          whileTap={{ scale: saving ? 1 : 0.98 }}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving" : "Save profile"}
        </motion.button>
      </div>
    </form>
  );
}
