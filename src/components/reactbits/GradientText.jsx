export default function GradientText({
  children,
  className = "",
  colors = ["#e6fbff", "#4fc3ff", "#0eb6d3", "#e6fbff"],
  lightColors,
  animationSpeed = 8,
  pauseOnHover = false,
}) {
  const style = {
    "--gradient-text-colors": colors.join(", "),
    "--gradient-text-duration": `${animationSpeed}s`,
  };

  if (lightColors?.length) {
    style["--gradient-light-text-colors"] = lightColors.join(", ");
  }

  return (
    <span
      className={`rb-gradient-text ${pauseOnHover ? "rb-gradient-pause" : ""} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
