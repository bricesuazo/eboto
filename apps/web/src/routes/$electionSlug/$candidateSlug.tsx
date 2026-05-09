import { Link, createFileRoute, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@eboto/backend/api';
import { User as UserIcon } from 'lucide-react';
import dayjs from 'dayjs';

import { PagePending } from '~/components/page-pending';
import { formatName } from '~/lib/election';

export const Route = createFileRoute('/$electionSlug/$candidateSlug')({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      convexQuery(api.candidates.getBySlug, {
        electionSlug: params.electionSlug,
        candidateSlug: params.candidateSlug,
      }),
    );
    if (!data) throw notFound();
  },
  pendingComponent: PagePending,
  component: CandidatePage,
});

function CandidatePage() {
  const { electionSlug, candidateSlug } = Route.useParams();
  const { data } = useQuery(
    convexQuery(api.candidates.getBySlug, { electionSlug, candidateSlug }),
  );
  if (!data) throw notFound();

  const { election, candidate } = data;
  const fullName = formatName(election.nameArrangement, candidate);
  const { achievements, affiliations, eventsAttended } = candidate.credentials;

  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <nav className="text-muted-foreground mb-6 text-sm">
        <Link
          to="/$electionSlug"
          params={{ electionSlug }}
          className="hover:text-foreground"
        >
          {election.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{fullName}</span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg sm:w-64 shrink-0 sm:sticky sm:top-20 sm:self-start">
          {candidate.imageUrl ? (
            <img
              src={candidate.imageUrl}
              alt={fullName}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <UserIcon className="text-muted-foreground absolute inset-0 m-auto size-24" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{fullName}</h1>
          {candidate.position && (
            <p className="text-muted-foreground">
              Running for{' '}
              <span className="text-foreground">
                {candidate.position.name}
              </span>
            </p>
          )}
          {candidate.partylist && (
            <p className="text-muted-foreground">
              {candidate.partylist.name}
            </p>
          )}

          {candidate.platforms.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                Platform{candidate.platforms.length > 1 ? 's' : ''}
              </h2>
              <ul className="mt-3 space-y-3">
                {candidate.platforms.map((p) => (
                  <li key={p._id}>
                    <h3 className="font-medium">{p.title}</h3>
                    {p.description && (
                      <p className="text-muted-foreground text-sm">
                        {p.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(achievements.length || affiliations.length || eventsAttended.length) ? (
            <section className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold">Credentials</h2>

              {achievements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold">
                    Achievement{achievements.length > 1 ? 's' : ''}
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {achievements.map((a) => (
                      <li key={a._id}>
                        {a.name} — ({dayjs(a.year).format('YYYY')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {affiliations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold">
                    Affiliation{affiliations.length > 1 ? 's' : ''}
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {affiliations.map((a) => (
                      <li key={a._id}>
                        {a.orgName} — {a.orgPosition} (
                        {dayjs(a.startYear).format('YYYY')}–
                        {dayjs(a.endYear).format('YYYY')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {eventsAttended.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold">
                    Seminar{eventsAttended.length > 1 ? 's' : ''}/Event
                    {eventsAttended.length > 1 ? 's' : ''} Attended
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {eventsAttended.map((e) => (
                      <li key={e._id}>
                        {e.name} ({dayjs(e.year).format('YYYY')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <p className="text-muted-foreground mt-8 text-sm">
              No credentials found. If you are the candidate, please contact
              the election commissioner to add your credentials.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
