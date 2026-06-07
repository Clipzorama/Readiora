import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const legalContent = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    updated: "June 7, 2026",
    introduction:
      "This policy explains how Readiora processes information when you create an account and use its study tools.",
    sections: [
      {
        title: "Information we process",
        body: "Readiora processes account details, profile information, subjects, notes, study activity, quizzes, flashcards, uploaded files, and technical information needed to operate and secure the service.",
      },
      {
        title: "How information is used",
        body: "Information is used to provide authentication, store your study workspace, generate requested AI study materials, maintain service reliability, prevent abuse, and improve product functionality.",
      },
      {
        title: "Service providers",
        body: "Readiora uses infrastructure and service providers such as Supabase for authentication, database, storage, and server functions; OpenAI for requested AI processing; and hosting, DNS, and OAuth providers needed to deliver the application.",
      },
      {
        title: "AI processing",
        body: "When you request an AI feature, relevant note or attachment content may be sent to the configured AI provider to produce the requested result. Do not upload information you are not authorized to process.",
      },
      {
        title: "Data control and retention",
        body: "You can edit or delete supported workspace content from the application. Some operational records may be retained when required for security, legal compliance, backup recovery, or service integrity.",
      },
      {
        title: "Security",
        body: "Readiora uses access controls, encrypted connections, and account-scoped database policies. No internet service can guarantee absolute security, so users should protect their credentials and report suspected unauthorized access.",
      },
      {
        title: "Policy updates",
        body: "This policy may be updated as the service changes. The date shown on this page identifies the latest published version.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms of Service",
    updated: "June 7, 2026",
    introduction:
      "These terms govern access to and use of Readiora. By using the service, you agree to use it lawfully and responsibly.",
    sections: [
      {
        title: "Account responsibilities",
        body: "You are responsible for providing accurate account information, safeguarding your credentials, and all activity performed through your account.",
      },
      {
        title: "Permitted use",
        body: "Readiora may be used for lawful personal and educational purposes. You may not misuse the service, bypass access controls, interfere with its operation, or upload content that violates applicable law or third-party rights.",
      },
      {
        title: "Your content",
        body: "You retain ownership of content you submit. You grant Readiora the limited permission required to store, process, and transmit that content solely to operate the features you request.",
      },
      {
        title: "AI-generated material",
        body: "AI output can be incomplete or inaccurate and should be reviewed before relying on it. Readiora does not guarantee academic results or the correctness of generated study material.",
      },
      {
        title: "Service availability",
        body: "Features may change, experience interruptions, or be discontinued. Reasonable efforts are made to maintain reliability, but uninterrupted availability is not guaranteed.",
      },
      {
        title: "Termination",
        body: "Access may be restricted or terminated when these terms are violated, the service is abused, or action is necessary to protect users, providers, or the platform.",
      },
      {
        title: "Changes to these terms",
        body: "These terms may be updated as Readiora evolves. Continued use after an update means you accept the revised terms.",
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const content = legalContent[type] ?? legalContent.privacy;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-primary sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Readiora
          </Link>
          <ThemeToggle compact />
        </div>

        <article className="mt-6 rounded-3xl border border-border bg-card/80 p-5 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-button-hover">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{content.title}</h1>
          <p className="mt-3 text-sm text-muted">Last updated: {content.updated}</p>
          <p className="mt-6 text-base leading-8 text-secondary">{content.introduction}</p>

          <div className="mt-8 grid gap-7">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-2 leading-7 text-secondary">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
