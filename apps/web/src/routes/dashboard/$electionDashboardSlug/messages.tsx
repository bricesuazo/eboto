import { useEffect, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  notFound,
  useRouteContext,
} from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { Shield, User as UserIcon } from 'lucide-react';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { ChatThread } from '~/components/chat-thread';
import { DashboardPending } from '~/components/dashboard-pending';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

type AdminRoomId = Id<'admin_commissioners_rooms'>;
type VoterRoomId = Id<'commissioners_voters_rooms'>;

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/messages',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.messaging.listVoterRooms, { electionId: election._id }),
    );
  },
  pendingComponent: DashboardPending,
  component: MessagesPage,
});

function MessagesPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { user } = useRouteContext({ from: '__root__' });
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  const { data: voterRooms = [] } = useQuery(
    convexQuery(api.messaging.listVoterRooms, { electionId: election._id }),
  );
  const ensureAdminRoom = useMutation(api.messaging.ensureAdminRoom);

  // Lazily ensure the single admin room exists when the commissioner picks
  // the admin tab. We don't auto-create on page load to avoid spurious rows
  // for elections that never use admin chat.
  const [adminRoomId, setAdminRoomId] = useState<AdminRoomId | null>(null);
  const [activeRoom, setActiveRoom] = useState<
    | { kind: 'admin' }
    | { kind: 'voter'; id: VoterRoomId }
    | null
  >(null);

  useEffect(() => {
    if (activeRoom?.kind !== 'admin' || adminRoomId) return;
    void ensureAdminRoom({ electionId: election._id }).then(setAdminRoomId);
  }, [activeRoom, adminRoomId, election._id, ensureAdminRoom]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Chat with platform admin and registered voters.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid h-[640px] grid-cols-[260px_1fr]">
          <aside className="overflow-y-auto border-r">
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent',
                activeRoom?.kind === 'admin' && 'bg-accent',
              )}
              onClick={() => setActiveRoom({ kind: 'admin' })}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Shield className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">Platform admin</div>
                <div className="text-muted-foreground truncate text-xs">
                  Support for this election
                </div>
              </div>
            </button>

            <Separator />

            <div className="text-muted-foreground px-4 py-2 text-xs uppercase">
              Voters
            </div>
            {voterRooms.length === 0 ? (
              <p className="text-muted-foreground px-4 py-3 text-xs">
                No voter conversations yet.
              </p>
            ) : (
              voterRooms.map((room) => (
                <button
                  key={room._id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent',
                    activeRoom?.kind === 'voter' &&
                      activeRoom.id === room._id &&
                      'bg-accent',
                  )}
                  onClick={() =>
                    setActiveRoom({ kind: 'voter', id: room._id })
                  }
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {room.voterEmail ?? room.name}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {room.lastMessage?.message ?? 'No messages yet'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </aside>

          {!activeRoom ? (
            <CardContent className="text-muted-foreground flex items-center justify-center text-sm">
              Pick a conversation to start chatting.
            </CardContent>
          ) : activeRoom.kind === 'admin' ? (
            adminRoomId ? (
              <ChatThread
                roomId={adminRoomId}
                side="admin"
                currentUserId={user?._id ?? ''}
                emptyState="Send a message to the platform admin."
              />
            ) : (
              <CardContent className="text-muted-foreground flex items-center justify-center text-sm">
                Opening chat…
              </CardContent>
            )
          ) : (
            <ChatThread
              roomId={activeRoom.id}
              side="voter"
              currentUserId={user?._id ?? ''}
              emptyState="Reply to start the conversation."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
