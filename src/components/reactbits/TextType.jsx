import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function TextType({
  text,
  className = "",
  typingSpeed = 64,
  deletingSpeed = 34,
  pauseDuration = 1800,
  loop = true,
  cursorCharacter = "_",
}) {
  const prefersReducedMotion = useReducedMotion();
  const words = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    prefersReducedMotion ? words[0]?.length || 0 : 0,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || words.length === 0) {
      return undefined;
    }

    const activeWord = words[wordIndex] || "";
    const atFullWord = visibleCount === activeWord.length;
    const atEmptyWord = visibleCount === 0;
    const shouldRotate = loop || wordIndex < words.length - 1;
    const delay = atFullWord && !isDeleting ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed;

    const timeout = window.setTimeout(() => {
      if (atFullWord && !isDeleting) {
        if (shouldRotate) setIsDeleting(true);
        return;
      }

      if (atEmptyWord && isDeleting) {
        setIsDeleting(false);
        setWordIndex((current) => (current + 1) % words.length);
        return;
      }

      setVisibleCount((current) => current + (isDeleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    deletingSpeed,
    isDeleting,
    loop,
    pauseDuration,
    prefersReducedMotion,
    typingSpeed,
    visibleCount,
    wordIndex,
    words,
  ]);

  const activeText = words[prefersReducedMotion ? 0 : wordIndex] || "";
  const displayCount = prefersReducedMotion ? activeText.length : visibleCount;

  return (
    <span className={`rb-text-type ${className}`} aria-label={activeText}>
      <span aria-hidden="true">{activeText.slice(0, displayCount)}</span>
      <span className="rb-text-type-cursor" aria-hidden="true">
        {cursorCharacter}
      </span>
    </span>
  );
}
