export const emptyDraft = {
  title: "",
  subjectId: "",
  content: "",
};

export const workspaceVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.985,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};
