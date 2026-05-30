const subscriptMap = {
  0: "₀",
  1: "₁",
  2: "₂",
  3: "₃",
  4: "₄",
  5: "₅",
  6: "₆",
  7: "₇",
  8: "₈",
  9: "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

const superscriptMap = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  a: "ᵃ",
  b: "ᵇ",
  c: "ᶜ",
  d: "ᵈ",
  e: "ᵉ",
  f: "ᶠ",
  g: "ᵍ",
  h: "ʰ",
  i: "ⁱ",
  j: "ʲ",
  k: "ᵏ",
  l: "ˡ",
  m: "ᵐ",
  n: "ⁿ",
  o: "ᵒ",
  p: "ᵖ",
  r: "ʳ",
  s: "ˢ",
  t: "ᵗ",
  u: "ᵘ",
  v: "ᵛ",
  w: "ʷ",
  x: "ˣ",
  y: "ʸ",
  z: "ᶻ",
};

function convertScript(value, map) {
  return value
    .replaceAll("\\infty", "∞")
    .replaceAll("\\gamma", "γ")
    .split("")
    .map((character) => map[character] ?? character)
    .join("");
}

function formatMathExpression(value) {
  return value
    .trim()
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\,", " ")
    .replaceAll("\\mathbb{E}", "𝔼")
    .replaceAll("\\sum", "∑")
    .replaceAll("\\infty", "∞")
    .replaceAll("\\gamma", "γ")
    .replaceAll("\\cdot", "·")
    .replace(/_\{([^}]+)\}/g, (_, script) => convertScript(script, subscriptMap))
    .replace(/\^\{([^}]+)\}/g, (_, script) => convertScript(script, superscriptMap))
    .replace(/_([A-Za-z0-9+\-=]+)/g, (_, script) => convertScript(script, subscriptMap))
    .replace(/\^([A-Za-z0-9+\-=]+)/g, (_, script) => convertScript(script, superscriptMap))
    .replace(/\s+/g, " ");
}

function renderInlineMath(text, keyPrefix) {
  const parts = text.split(/(\\\(.+?\\\)|\$.+?\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return (
        <span key={`${keyPrefix}-${index}`} className="font-serif text-primary">
          {formatMathExpression(part.slice(2, -2))}
        </span>
      );
    }

    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <span key={`${keyPrefix}-${index}`} className="font-serif text-primary">
          {formatMathExpression(part.slice(1, -1))}
        </span>
      );
    }

    return part;
  });
}

export default function SummaryText({ children, clamp = false }) {
  const value = String(children ?? "");
  const blocks = value.split(/(\$\$[\s\S]+?\$\$)/g);

  return (
    <div className={clamp ? "line-clamp-5" : undefined}>
      {blocks.map((block, index) => {
        if (block.startsWith("$$") && block.endsWith("$$")) {
          return (
            <div
              key={`math-${index}`}
              className="my-3 overflow-x-auto rounded-xl border border-strong-border/40 bg-background/70 px-4 py-3 font-serif text-lg leading-8 text-primary sm:text-xl"
            >
              {formatMathExpression(block.slice(2, -2))}
            </div>
          );
        }

        return (
          <p key={`text-${index}`} className="whitespace-pre-line">
            {renderInlineMath(block, `inline-${index}`)}
          </p>
        );
      })}
    </div>
  );
}
