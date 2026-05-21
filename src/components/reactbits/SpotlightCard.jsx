import { useRef } from "react";

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.18)",
}) {
  const divRef = useRef(null);

  function handleMouseMove(event) {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty(
      "--spotlight-x",
      `${event.clientX - rect.left}px`,
    );
    divRef.current.style.setProperty(
      "--spotlight-y",
      `${event.clientY - rect.top}px`,
    );
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`rb-spotlight-card relative overflow-hidden ${className}`}
      style={{ "--spotlight-color": spotlightColor }}
    >
      <div
        aria-hidden="true"
        className="rb-spotlight-glow pointer-events-none absolute inset-0 z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
