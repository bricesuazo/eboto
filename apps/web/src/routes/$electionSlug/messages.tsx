import { useEffect, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  notFound,
  redirect,
  useRouteContext,
} from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { ChatThread } from '~/components/chat-thread';
import { PagePending } from '~/components/page-pending';
import { Card, CardContent } from '~/components/ui/card';

export const Route = createFileRoute('/$electionSlug/messages')({
  beforeLoad: async ({ context, params }) => {
    // Layout already enforces general access. We additionally require the
    // viewer be a registered voter — non-voters have nothing to chat about.
    const data = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getBySlug, { slug: params.electionSlug }),
    );
    if (!data) throw notFound();
    if (!data.isVoter && !data.isCommissioner) {
      throw redirect({
        to: '/$electionSlug',
        params: { electionSlug: params.electionSlug },
      });
    }
    // Voter chat is Boost-only. A voter following a stale link to /messages
    // on a free election lands back on the public page instead of hitting
    // the server-side forbidden error from `ensureMyVoterRoom`. Commissioners
    // get to keep using the route (they manage upgrades from the dashboard).
    if (!data.isCommissioner && data.election.variantId === 0) {
      throw redirect({
        to: '/$electionSlug',
        params: { electionSlug: params.electionSlug },
      });
    }
  },
  pendingComponent: PagePending,
  component: VoterMessagesPage,
});

function VoterMessagesPage() {
  const { electionSlug } = Route.useParams();
  const { user } = useRouteContext({ from: '__root__' });
  const { data } = useQuery(
    convexQuery(api.elections.getBySlug, { slug: electionSlug }),
  );
  const ensureMyVoterRoom = useMutation(api.messaging.ensureMyVoterRoom);
  const [roomId, setRoomId] = useState<Id<'commissionersVotersRooms'> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Lazily create the room on mount. Voters who never open this page won't
  // accumulate empty rows; once it's created the id sticks for the session.
  useEffect(() => {
    if (!data || roomId) return;
    void ensureMyVoterRoom({ electionId: data.election._id })
      .then((id) => setRoomId(id))
      .catch((err) => {
        setError(
          err instanceof ConvexError
            ? ((err.data as { message?: string }).message ?? 'Failed')
            : 'Failed',
        );
      });
  }, [data, roomId, ensureMyVoterRoom]);

  if (!data) throw notFound();

  return (
    <main className="container mx-auto max-w-2xl px-6 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Direct line to the commissioners of {data.election.name}.
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="h-[640px]">
          {error ? (
            <CardContent className="flex h-full items-center justify-center text-sm text-destructive">
              {error}
            </CardContent>
          ) : roomId ? (
            <ChatThread
              roomId={roomId}
              side="voter"
              currentUserId={user?._id ?? ''}
              emptyState="Send a message to the commissioners."
            />
          ) : (
            <CardContent className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Opening chat…
            </CardContent>
          )}
        </div>
      </Card>
    </main>
  );
}
