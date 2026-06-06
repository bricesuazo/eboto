import type { ReactNode } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarDays,
  User as UserIcon,
} from 'lucide-react';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_URL } from '~/lib/constants';
import { formatName, formatYear } from '~/lib/election';

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
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      convexQuery(api.candidates.getBySlug, {
        electionSlug: params.electionSlug,
        candidateSlug: params.candidateSlug,
      }),
    ),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: 'eBoto' }] };
    const { election, candidate } = loaderData;
    const fullName = formatName(election.nameArrangement, candidate);
    const description = `See information about ${candidate.firstName} ${candidate.lastName} | eBoto`;
    const namePart =
      encodeURIComponent(candidate.firstName) +
      (candidate.middleName
        ? `%20${encodeURIComponent(candidate.middleName)}`
        : '') +
      `%20${encodeURIComponent(candidate.lastName)}`;
    const ogImageUrl = `${SITE_URL}/api/og?type=candidate&candidate_name=${namePart}&candidate_position=${encodeURIComponent(
      candidate.position?.name ?? '',
    )}&candidate_img=${encodeURIComponent(candidate.imageUrl ?? '')}`;
    const ogTitle = `${fullName} - ${election.name}`;
    return {
      meta: [
        { title: `${ogTitle} | eBoto` },
        { name: 'description', content: description },
        { property: 'og:title', content: ogTitle },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:width', content: String(OG_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: fullName },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: ogTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImageUrl },
      ],
    };
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
  const hasCredentials =
    achievements.length > 0 ||
    affiliations.length > 0 ||
    eventsAttended.length > 0;

  return (
    <main className="container mx-auto max-w-4xl px-6 py-10 sm:py-14">
      <Link
        to="/$electionSlug"
        params={{ electionSlug }}
        className="group inline-flex items-center gap-2 text-xs text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft
          className="size-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        <span className="line-clamp-1">Back to {election.name}</span>
      </Link>

      <header className="mt-10 flex flex-col items-center text-center sm:mt-14">
        <div className="relative size-40 overflow-hidden rounded-full ring-1 ring-border sm:size-52">
          {candidate.imageUrl ? (
            <img
              src={candidate.imageUrl}
              alt={fullName}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/40">
              <UserIcon
                className="size-14 text-muted-foreground sm:size-16"
                aria-hidden
              />
            </div>
          )}
        </div>

        <h1 className="mt-8 text-3xl font-bold text-balance sm:text-5xl">
          {fullName}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {candidate.position && (
            <Pill label="Running for" value={candidate.position.name} />
          )}
          {candidate.partylist && (
            <Pill
              label={candidate.partylist.acronym || 'Party'}
              value={candidate.partylist.name}
            />
          )}
        </div>
      </header>

      {candidate.platforms.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <SectionLabel
            label={`Platform${candidate.platforms.length > 1 ? 's' : ''}`}
          />
          <ol className="mt-10 space-y-8">
            {candidate.platforms.map((p, i) => (
              <li
                key={p._id}
                className="border-b border-foreground/10 pb-8 last:border-0 last:pb-0"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg text-balance sm:text-xl">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="mt-2 leading-relaxed text-pretty text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-16 sm:mt-20">
        <SectionLabel label="Credentials" />
        {hasCredentials ? (
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <CredentialBlock
              icon={<Award className="size-3.5" aria-hidden />}
              label={`Achievement${achievements.length === 1 ? '' : 's'}`}
              items={achievements.map((a) => ({
                _id: a._id,
                primary: a.name,
                secondary: formatYear(a.year),
              }))}
            />
            <CredentialBlock
              icon={<Building2 className="size-3.5" aria-hidden />}
              label={`Affiliation${affiliations.length === 1 ? '' : 's'}`}
              items={affiliations.map((a) => ({
                _id: a._id,
                primary: a.orgName,
                secondary: formatAffiliationMeta(a),
              }))}
            />
            <CredentialBlock
              icon={<CalendarDays className="size-3.5" aria-hidden />}
              label={`Event${eventsAttended.length === 1 ? '' : 's'} Attended`}
              items={eventsAttended.map((e) => ({
                _id: e._id,
                primary: e.name,
                secondary: formatYear(e.year),
              }))}
            />
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed py-10 text-center">
            <p className="mx-auto max-w-md px-6 text-sm text-muted-foreground">
              No credentials available yet. If you are this candidate, please
              contact the election commissioner to add your credentials.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1">
      <span className="text-xs text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </span>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-border" aria-hidden />
      <p className="text-sm font-semibold text-muted-foreground uppercase">
        {label}
      </p>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

function CredentialBlock({
  icon,
  label,
  items,
}: {
  icon: ReactNode;
  label: string;
  items: { _id: string; primary: string; secondary: string | null }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs uppercase">{label}</p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item._id}
            className="border-l-2 border-foreground/15 pl-3 leading-snug"
          >
            <p className="text-sm font-medium text-balance">{item.primary}</p>
            {item.secondary && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.secondary}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatAffiliationMeta(a: {
  orgPosition: string;
  startYear?: string | null;
  endYear?: string | null;
}): string {
  const start = formatYear(a.startYear);
  const end = formatYear(a.endYear);
  const range = start && end ? `${start}–${end}` : (start ?? end);
  return range ? `${a.orgPosition} · ${range}` : a.orgPosition;
}
