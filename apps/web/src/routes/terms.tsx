import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/legal-page';

export const Route = createFileRoute('/terms')({
  component: () => (
    <LegalPage title="Terms of Service">
      <p>
        By using eBoto you agree to use the platform only for lawful, good-faith
        elections. Election commissioners are responsible for the accuracy of
        their voter list and candidate information.
      </p>
      <p>
        Full legal text is identical to the previous Next.js site; see the
        production page until this section is fully ported.
      </p>
    </LegalPage>
  ),
});
