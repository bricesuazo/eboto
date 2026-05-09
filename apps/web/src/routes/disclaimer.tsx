import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/legal-page';

export const Route = createFileRoute('/disclaimer')({
  component: () => (
    <LegalPage title="Disclaimer">
      <p>
        eBoto is provided as-is. The platform is an aid for organizing
        elections; the results it reports reflect the data its commissioners
        and voters have supplied.
      </p>
    </LegalPage>
  ),
});
