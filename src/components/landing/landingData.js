import { Gauge, Layers3, ShieldCheck, Timer, Zap } from "lucide-react";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.12,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

export const metricCards = [
  { icon: Timer, value: "42m", label: "focused block" },
  { icon: Layers3, value: "18", label: "active notes" },
  { icon: ShieldCheck, value: "82%", label: "exam readiness" },
];

export const missionRows = [
  { title: "Cellular respiration", status: "Review", value: "88%" },
  { title: "Genetics flashcards", status: "Practice", value: "64%" },
  { title: "Essay outline", status: "Draft", value: "71%" },
];

export const statusPills = [
  "Analyzing notes",
  "Weak topics detected",
  "Flashcards ready",
  "Quiz queue online",
];

export const activityFeed = [
  {
    time: "00:03",
    label: "Scanning uploaded biology notes...",
    tone: "text-secondary",
  },
  {
    time: "00:09",
    label: "Mapping concepts: cellular respiration, genetics, enzymes...",
    tone: "text-secondary",
  },
  {
    time: "00:15",
    label: "Weak topic detected: ATP synthesis",
    tone: "text-primary",
  },
  {
    time: "00:21",
    label: "Generating flashcards from lecture notes",
    tone: "text-secondary",
  },
  {
    time: "00:28",
    label: "Building quiz from missed concepts",
    tone: "text-secondary",
  },
  {
    time: "00:34",
    label: "Exam readiness updated: 82%",
    tone: "text-primary",
  },
];

export const dashboardMetrics = [
  {
    icon: Gauge,
    label: "Exam Readiness",
    value: "82%",
    progress: "82%",
    liveProgress: ["54%", "82%", "77%", "82%"],
  },
  {
    icon: Timer,
    label: "Focus Window",
    value: "42:00",
    progress: "68%",
    liveProgress: ["38%", "68%", "61%", "68%"],
  },
  {
    icon: Layers3,
    label: "Active Notes",
    value: "18",
    progress: "74%",
    liveProgress: ["44%", "74%", "69%", "74%"],
  },
  {
    icon: Zap,
    label: "Weak Topics",
    value: "4",
    progress: "46%",
    liveProgress: ["24%", "46%", "39%", "46%"],
  },
];

export const reviewQueue = ["Flashcards", "Quiz", "Essay Outline"];

export const weakTopics = [
  { label: "ATP synthesis", score: "High priority", progress: "82%" },
  { label: "Punnett squares", score: "Recheck", progress: "58%" },
  { label: "Enzyme inhibition", score: "Practice", progress: "64%" },
];

export const faqItems = [
  {
    question: "What is Readiora?",
    answer:
      "Readiora is an AI-powered study command center for organizing subjects, managing notes, and turning study material into focused review workflows.",
  },
  {
    question: "How do Readiora's AI study tools help me review?",
    answer:
      "Readiora is designed to convert your content into practical review assets such as summaries, flashcards, quizzes, weak-topic queues, and exam prep prompts.",
  },
  {
    question: "Can I upload notes and course materials?",
    answer:
      "Yes. Readiora supports a workflow built around bringing your notes and study materials into the platform so they can be organized and used for smarter review.",
  },
  {
    question: "Is my study data private?",
    answer:
      "Readiora treats privacy as a core product expectation. Your workspace is built around your own subjects, notes, and review activity rather than public sharing.",
  },
  {
    question: "Can I organize notes by subject?",
    answer:
      "Yes. The landing workflow is centered on creating subject lanes so each class, topic, or exam track has its own organized place.",
  },
  {
    question: "Does Readiora work on mobile?",
    answer:
      "The interface is responsive for desktop, tablet, and mobile access, so your study workspace can travel with you.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Readiora is being positioned as a premium study platform. Current pricing details should be shown in-app or announced when plans are finalized.",
  },
];
