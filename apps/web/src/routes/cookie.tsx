import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/legal-page';

export const Route = createFileRoute('/cookie')({
  component: () => (
    <LegalPage title="Cookie Policy">
      <p>
        eBoto uses cookies for authentication (session tokens) and for
        anonymous product analytics (PostHog). You can disable analytics by
        rejecting non-essential cookies in your browser.
      </p>
    </LegalPage>
  ),
});
