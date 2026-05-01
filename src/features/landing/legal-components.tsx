/**
 * Shared legal page section components.
 * Extracted from privacy.tsx and terms.tsx to reduce duplication.
 */

import { type ReactNode } from "react";

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * A standard section for legal pages with a title and content.
 */
export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}

interface LegalListSectionProps {
  title: string;
  items: ReactNode[];
}

/**
 * A section for legal pages with a title and a list of items.
 */
export function LegalListSection({ title, items }: LegalListSectionProps) {
  return (
    <LegalSection title={title}>
      <ul className="list-disc pl-6 space-y-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </LegalSection>
  );
}

interface LegalContactSectionProps {
  email: string;
}

/**
 * A contact section for the end of legal pages.
 */
export function LegalContactSection({ email }: LegalContactSectionProps) {
  return (
    <section className="pt-8 border-t border-border">
      <p className="text-sm text-muted-foreground">
        If you have any questions about this, please contact us at {email}.
      </p>
    </section>
  );
}