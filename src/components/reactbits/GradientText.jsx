export default function GradientText({
  children,
  className = "",
  colors = ["#e6fbff", "#4fc3ff", "#0eb6d3", "#e6fbff"],
  animationSpeed = 8,
  pauseOnHover = false,
}) {
  return (
    <span
      className={`rb-gradient-text ${pauseOnHover ? "rb-gradient-pause" : ""} ${className}`}
      style={{
        "--gradient-text-colors": colors.join(", "),
        "--gradient-text-duration": `${animationSpeed}s`,
      }}
    >
      {children}
    </span>
  );
}
