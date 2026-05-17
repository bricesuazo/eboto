import { useEffect, useRef, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';

type Side = 'voter' | 'admin';

interface ChatThreadProps {
  /** Room id — discriminated by `side`. */
  roomId: Id<'commissioners_voters_rooms'> | Id<'admin_commissioners_rooms'>;
  side: Side;
  /** Logged-in user id; messages they sent are right-aligned. */
  currentUserId: string;
  emptyState?: string;
  className?: string;
}

export function ChatThread({
  roomId,
  side,
  currentUserId,
  emptyState,
  className,
}: ChatThreadProps) {
  const { data: messages = [] } = useQuery(
    convexQuery(api.messaging.listMessages, { roomId, side }),
  );
  const send = useMutation(api.messaging.sendMessage);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message. Convex queries are reactive so the array
  // grows as messages arrive — we just chase the bottom.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await send({ roomId, side, message: trimmed });
      setDraft('');
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Failed')
          : 'Failed',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {emptyState ?? 'No messages yet. Say hi.'}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.userId === currentUserId;
            return (
              <div
                key={m._id}
                className={cn(
                  'flex flex-col gap-1',
                  mine ? 'items-end' : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                    mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {m.message}
                </div>
                <span className="text-xs text-muted-foreground">
                  {!mine && (m.authorName ?? m.authorEmail) && (
                    <>
                      {m.authorName ?? m.authorEmail}
                      {' · '}
                    </>
                  )}
                  {dayjs(m._creationTime).format('MMM D, h:mm A')}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={sending}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="self-end"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter to send, Shift+Enter for newline.
        </p>
      </div>
    </div>
  );
}
