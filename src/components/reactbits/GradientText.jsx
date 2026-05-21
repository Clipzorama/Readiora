export default function GradientText({
  children,
  className = "",
  colors = ["#f4eeee", "#b73a3a", "#f2c078", "#f4eeee"],
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
