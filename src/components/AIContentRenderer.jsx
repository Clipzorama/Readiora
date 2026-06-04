import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const greekSymbols = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  ε: "\\epsilon",
  θ: "\\theta",
  λ: "\\lambda",
  μ: "\\mu",
  π: "\\pi",
  σ: "\\sigma",
};

const formulaStartPattern =
  /\b(?:V|Q|P|R|E|F|A|I|N|C|S|T|M|Var|Cov|Pr)\s*(?:=|\^|_|\*|\()|\b[a-z]\s*(?:=|\^|_|\*)|Σ|∑|max_|argmax_|min_|[αβγδεθλμπσ]/;

function hasMathDelimiters(line) {
  return /\$|\\\(|\\\[/.test(line);
}

function escapeLatexText(value) {
  return value.replace(/_/g, "\\_");
}

function latexifyExpression(value) {
  return value
    .trim()
    .replace(/[αβγδεθλμπσ]/g, (symbol) => greekSymbols[symbol] ?? symbol)
    .replace(/Σ\s*_\s*\{([^}]+)\}/g, "\\sum_{$1}")
    .replace(/∑\s*_\s*\{([^}]+)\}/g, "\\sum_{$1}")
    .replace(/Σ\s*_\s*([A-Za-z][A-Za-z0-9']*)/g, "\\sum_{$1}")
    .replace(/∑\s*_\s*([A-Za-z][A-Za-z0-9']*)/g, "\\sum_{$1}")
    .replace(/\bargmax\s*_\s*\{([^}]+)\}/g, "\\arg\\max_{$1}")
    .replace(/\bargmax\s*_\s*([A-Za-z][A-Za-z0-9']*)/g, "\\arg\\max_{$1}")
    .replace(/\bmax\s*_\s*\{([^}]+)\}/g, "\\max_{$1}")
    .replace(/\bmax\s*_\s*([A-Za-z][A-Za-z0-9']*)/g, "\\max_{$1}")
    .replace(/\bmin\s*_\s*\{([^}]+)\}/g, "\\min_{$1}")
    .replace(/\bmin\s*_\s*([A-Za-z][A-Za-z0-9']*)/g, "\\min_{$1}")
    .replace(/\b([A-Z])\*(?=\()/g, "$1^*")
    .replace(/\b([A-Z])\^\\pi(?=\()/g, "$1^{\\pi}")
    .replace(/\b([A-Z])\^([A-Za-z])(?=\()/g, "$1^{$2}")
    .replace(/\bpi(?=\()/g, "\\pi");
}

function splitFormulaExpressions(value) {
  return value
    .split(/(?<=\])\s+(?=(?:[A-Z]\*?|[A-Z]\^[^ ]+)\()/)
    .map((expression) => expression.trim())
    .filter(Boolean);
}

function formatInlineBareFormulas(line) {
  if (hasMathDelimiters(line) || !line.includes("=")) {
    return line;
  }

  return line.replace(
    /\b((?:[A-Za-z](?:\([^)]+\))?|[A-Za-z](?:\^\d+|\^[A-Za-z])?|[A-Za-z]_[A-Za-z0-9{}]+|Var\([^)]+\)|Cov\([^)]+\)|Pr\([^)]+\))\s*=\s*[^.,;!?]+)/g,
    (formula) => `$${latexifyExpression(formula)}$`,
  );
}

function formatBareFormulaLine(line) {
  const match = line.match(/^(\s*(?:[-*+]\s+|\d+\.\s+)?)(.*)$/);
  const prefix = match?.[1] ?? "";
  const body = match?.[2] ?? line;

  if (!body.includes("=") || hasMathDelimiters(body) || !formulaStartPattern.test(body)) {
    return line;
  }

  const formulaStart = body.search(formulaStartPattern);
  const labelEnd = body.lastIndexOf(":", formulaStart);

  if (labelEnd < 0 && formulaStart > 0) {
    return prefix + formatInlineBareFormulas(body);
  }

  const label = labelEnd >= 0 ? body.slice(0, labelEnd + 1).trim() : "";
  const expression = labelEnd >= 0 ? body.slice(labelEnd + 1).trim() : body.trim();
  const formulas = splitFormulaExpressions(expression).map(latexifyExpression);
  const indent = prefix ? "  " : "";
  const formulaBlocks = formulas
    .map((formula) => `${indent}$$\n${indent}${formula}\n${indent}$$`)
    .join("\n\n");

  if (!prefix && !label) {
    return formulaBlocks;
  }

  return [prefix + escapeLatexText(label), "", formulaBlocks].filter(Boolean).join("\n");
}

function normalizeMathMarkdown(content) {
  return content
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, formula) => `$$\n${formula.trim()}\n$$`)
    .replace(/\\\((.*?)\\\)/g, (_, formula) => `$${formula.trim()}$`)
    .split("\n")
    .map(formatBareFormulaLine)
    .join("\n");
}

const baseComponents = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-3xl font-bold leading-tight text-primary">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-2xl font-bold leading-tight text-primary first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-xl font-semibold leading-tight text-primary first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-3 leading-8 text-secondary first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-secondary">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-secondary">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-8">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-strong-border bg-button/10 px-5 py-4 text-secondary">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const inline = !className;

    if (inline) {
      return (
        <code className="rounded-md border border-strong-border/60 bg-button/10 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-primary">
          {children}
        </code>
      );
    }

    return (
      <code className="block min-w-full font-mono text-sm leading-7 text-primary">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-2xl border border-strong-border/70 bg-background/95 p-4 shadow-inner shadow-black/10">
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-semibold text-button-hover underline decoration-button-hover/40 underline-offset-4 transition hover:text-primary"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full divide-y divide-border text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-card px-4 py-3 font-semibold text-primary">{children}</th>
  ),
  td: ({ children }) => <td className="border-t border-border px-4 py-3 text-secondary">{children}</td>,
};

export default function AIContentRenderer({
  children,
  className = "",
  clamp = false,
  components = {},
}) {
  const content = normalizeMathMarkdown(String(children ?? ""));

  return (
    <div
      className={[
        "ai-content min-w-0 text-secondary",
        clamp ? "line-clamp-5" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{ ...baseComponents, ...components }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
