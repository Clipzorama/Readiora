import { useState } from "react";

export default function UserAvatar({
  avatarUrl,
  initials = "XU",
  label = "User profile",
  size = "md",
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  const sizeClass = sizes[size] || sizes.md;
  const showImage = avatarUrl && !imageFailed;

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-strong-border/70 bg-button/20 font-bold text-primary shadow-[0_0_24px_hsl(var(--button)/0.16)] ${sizeClass} ${className}`}
      aria-label={label}
      title={label}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
