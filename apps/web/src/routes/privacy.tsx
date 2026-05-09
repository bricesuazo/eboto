import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/legal-page';

export const Route = createFileRoute('/privacy')({
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>
        eBoto stores your email and the elections you participate in. Votes
        are tied to a voter row and not to your auth identity beyond the email
        match used to authenticate you. We do not sell your data.
      </p>
    </LegalPage>
  ),
});
