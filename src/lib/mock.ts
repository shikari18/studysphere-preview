export const subjects = [
  { slug: "math", name: "Mathematics", icon: "∑", progress: 72, weak: ["Calculus", "Trig"], notes: 24, quizzes: 12, papers: 18 },
  { slug: "physics", name: "Physics", icon: "⚛︎", progress: 54, weak: ["Waves"], notes: 19, quizzes: 9, papers: 14 },
  { slug: "chemistry", name: "Chemistry", icon: "⚗︎", progress: 61, weak: ["Organic"], notes: 22, quizzes: 11, papers: 16 },
  { slug: "biology", name: "Biology", icon: "🧬", progress: 83, weak: [], notes: 28, quizzes: 14, papers: 12 },
  { slug: "english", name: "English Lit", icon: "✎", progress: 67, weak: ["Poetry"], notes: 17, quizzes: 8, papers: 9 },
  { slug: "econ", name: "Economics", icon: "$", progress: 45, weak: ["Macro", "Elasticity"], notes: 15, quizzes: 6, papers: 11 },
];

export const examBoards = [
  { code: "WAEC", papers: 412, trending: "Algebra" },
  { code: "IGCSE", papers: 1280, trending: "Mechanics" },
  { code: "SAT", papers: 96, trending: "Reading" },
  { code: "JAMB", papers: 320, trending: "Chemistry" },
];

export const pastQuestions = [
  { id: 1, board: "IGCSE", year: 2021, title: "IGCSE Math — May/June 2021 Paper 2 Q7", tags: ["Algebra", "Functions"] },
  { id: 2, board: "WAEC", year: 2022, title: "WAEC Physics — Nov 2022 Paper 1 Q12", tags: ["Mechanics", "Forces"] },
  { id: 3, board: "SAT", year: 2023, title: "SAT Math — March 2023 Section 4 Q18", tags: ["Quadratics"] },
  { id: 4, board: "JAMB", year: 2022, title: "JAMB Chemistry — 2022 Q9", tags: ["Organic"] },
  { id: 5, board: "Cambridge", year: 2023, title: "A-Level Biology — Oct 2023 Paper 3 Q4", tags: ["Genetics"] },
];

export const exams = [
  { name: "IGCSE Math Paper 2", days: 12, color: "primary" },
  { name: "Physics Mock", days: 5, color: "purple" },
  { name: "SAT Practice", days: 23, color: "primary" },
];

export const notes = [
  { id: 1, title: "Quadratic equations — full derivation", subject: "Math", edited: "2h ago", aiReady: true },
  { id: 2, title: "Newton's laws & worked examples", subject: "Physics", edited: "Yesterday", aiReady: true },
  { id: 3, title: "Organic nomenclature cheatsheet", subject: "Chemistry", edited: "3 days ago", aiReady: false },
  { id: 4, title: "Cell division summary", subject: "Biology", edited: "1 week ago", aiReady: true },
];

export const conversation = [
  { role: "user" as const, text: "Explain integration by parts simply." },
  {
    role: "ai" as const,
    text: "Integration by parts comes from the product rule, reversed.",
    card: {
      steps: [
        "Identify u and dv in the integrand.",
        "Compute du and v.",
        "Apply ∫u dv = uv − ∫v du.",
        "Solve the remaining integral.",
      ],
      tip: "Pick u using LIATE: Log, Inverse, Algebraic, Trig, Exponential.",
    },
  },
  { role: "user" as const, text: "Give me 3 past questions." },
];

export const studyHours = [1.2, 2.4, 1.8, 3.1, 2.7, 4.2, 3.6];
