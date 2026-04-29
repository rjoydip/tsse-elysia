/**
 * LLMO FAQ service.
 * Handles static FAQ data and filtering logic.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqResponse {
  "@context": "https://schema.org";
  "@type": "QAPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    answer: { "@type": "Answer"; text: string };
  }>;
}

const faqData: FaqItem[] = [
  {
    question: "What is TSS Elysia?",
    answer:
      "TSS Elysia is a modern full-stack framework powered by Elysia, TanStack Start, and React. It provides end-to-end type safety, authentication, and database integration.",
  },
  {
    question: "How do I get started?",
    answer:
      "Run `bun install` to install dependencies, then `bun run dev` to start the development server.",
  },
  {
    question: "What databases are supported?",
    answer: "TSS Elysia supports both SQLite and PostgreSQL databases through Drizzle ORM.",
  },
  {
    question: "How does authentication work?",
    answer: "TSS Elysia uses Better Auth for authentication, supporting OAuth and 2FA.",
  },
  {
    question: "Is this framework production-ready?",
    answer: "Yes, TSS Elysia is designed for production use with Docker support.",
  },
  {
    question: "What is the tech stack?",
    answer:
      "Backend: Elysia, Drizzle ORM, Better Auth. Frontend: React 19, TanStack Router, TanStack Query.",
  },
  {
    question: "How do I deploy to production?",
    answer:
      "TSS Elysia supports Docker deployment. Build with `docker build` and run with proper environment variables.",
  },
  {
    question: "Are there TypeScript type safety guarantees?",
    answer: "Yes, TSS Elysia provides end-to-end type safety from database schema to frontend.",
  },
];

export interface FaqQuery {
  q?: string | null;
}

export function getFaqData(query: FaqQuery): FaqResponse {
  const { q } = query;

  let filtered = faqData;
  if (q) {
    const lowerQ = q.toLowerCase();
    filtered = faqData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerQ) || faq.answer.toLowerCase().includes(lowerQ),
    );
  }

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: filtered.map((item) => ({
      "@type": "Question",
      name: item.question,
      answer: { "@type": "Answer", text: item.answer },
    })),
  };
}