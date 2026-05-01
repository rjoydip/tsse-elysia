/**
 * Privacy Policy Page
 * Uses shared legal page layout and components for consistency.
 */

import { LegalPageLayout } from "./legal-page-layout";
import { LegalListSection, LegalSection, LegalContactSection } from "./legal-components";

export function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalListSection
        title="1. Information We Collect"
        items={[
          "Personal identifiers (name, email address).",
          "Authentication credentials managed via Better Auth.",
          "Usage data and analytics to improve our service.",
        ]}
      />

      <LegalListSection
        title="2. How We Use Your Information"
        items={[
          "Provide, operate, and maintain our service.",
          "Improve, personalize, and expand our platform features.",
          "Understand and analyze how you use our service.",
          "Communicate with you regarding updates and support.",
          "Prevent fraudulent activity and ensure security.",
        ]}
      />

      <LegalSection title="3. Data Sharing">
        <p>
          We do not sell your personal data. We may share information with third-party service
          providers who perform services for us, such as authentication providers or cloud
          infrastructure, but only as necessary to provide the service.
        </p>
      </LegalSection>

      <LegalSection title="4. Data Security">
        <p>
          We prioritize the security of your data. We use industry-standard security measures,
          including encryption and secure authentication protocols, to protect your personal
          information from unauthorized access or disclosure.
        </p>
      </LegalSection>

      <LegalSection title="5. Your Choices">
        <p>
          You have the right to access, update, or delete your personal information at any time. You
          can manage your account settings and profile information directly within the application.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>
          We use cookies and similar tracking technologies to track activity on our service and hold
          certain information. You can instruct your browser to refuse all cookies or to indicate
          when a cookie is being sent.
        </p>
      </LegalSection>

      <LegalContactSection email="privacy@tsse-elysia.com" />
    </LegalPageLayout>
  );
}