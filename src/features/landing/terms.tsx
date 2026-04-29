/**
 * Terms of Service Page
 * Uses shared legal page layout and components for consistency.
 */

import { LegalPageLayout } from "./legal-page-layout";
import { LegalListSection, LegalSection, LegalContactSection } from "./legal-components";

export function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <LegalSection title="1. Introduction">
        <p>
          Welcome to TSS Elysia. By accessing or using our platform, you agree to be bound by these
          Terms of Service. If you do not agree with any part of these terms, you may not access the
          service.
        </p>
      </LegalSection>

      <LegalListSection
        title="2. Use of Service"
        items={[
          "You must provide accurate information when creating an account.",
          "You may not use the service for any illegal or unauthorized purpose.",
          "You must not attempt to disrupt or interfere with the security or performance of the service.",
        ]}
      />

      <LegalSection title="3. Intellectual Property">
        <p>
          The service and its original content, features, and functionality are and will remain the
          exclusive property of TSS Elysia and its licensors. Our trademarks and trade dress may not
          be used in connection with any product or service without our prior written consent.
        </p>
      </LegalSection>

      <LegalSection title="4. Termination">
        <p>
          We may terminate or suspend your account and bar access to the service immediately,
          without prior notice or liability, under our sole discretion, for any reason whatsoever
          and without limitation, including but not limited to a breach of the Terms.
        </p>
      </LegalSection>

      <LegalSection title="5. Limitation of Liability">
        <p>
          In no event shall TSS Elysia, nor its directors, employees, partners, agents, suppliers,
          or affiliates, be liable for any indirect, incidental, special, consequential or punitive
          damages, including without limitation, loss of profits, data, use, goodwill, or other
          intangible losses.
        </p>
      </LegalSection>

      <LegalSection title="6. Changes to Terms">
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any
          time. We will provide at least 30 days notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole discretion.
        </p>
      </LegalSection>

      <LegalContactSection email="supportt-sse-elysia@com" />
    </LegalPageLayout>
  );
}