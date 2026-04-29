/**
 * Shared legal page layout component.
 * Extracted from landing/privacy.tsx and landing/terms.tsx to reduce duplication.
 */

import { Header } from "~/components/layout/landing/header";
import { Footer } from "~/components/layout/landing/footer";
import { AnimatedPageBackground } from "~/components/animated-page-background";

export interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Shared layout for legal pages (Privacy Policy, Terms of Service, etc.).
 * Provides consistent structure with header, footer, and animated background.
 */
export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="relative isolate min-h-screen bg-background">
      <AnimatedPageBackground />
      <Header />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">
              {title}
            </h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}