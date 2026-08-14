/**
 * Reason prompt for edits made to an election that is already live.
 *
 * Once voting opens, eBoto stops freezing an election and starts publishing
 * it instead: the safe edits stay available, but every one of them lands in
 * the election's public change log along with the commissioner's stated
 * reason. The server enforces that (see `requireChangeReason` in
 * `_helpers/auth.ts`); this hook is the matching front door, so a
 * commissioner is asked for the reason before the mutation runs rather than
 * bounced by an error afterwards.
 *
 * A page builds the gate once and shares it through {@link ChangeReasonProvider}
 * so that the prompt is a single dialog no matter how deep the form or row
 * action lives — a per-row hook would mount one dialog per voter:
 *
 *   const gate = useChangeReason(slug);
 *   return (
 *     <ChangeReasonProvider value={gate}>
 *       …
 *       {gate.reasonDialog}
 *     </ChangeReasonProvider>
 *   );
 *
 * and any descendant:
 *
 *   const { live, requestReason } = useChangeReasonGate();
 *   const reason = await requestReason();
 *   if (reason === null) return;              // commissioner backed out
 *   await update({ ...values, reason });
 *
 * Before voting opens `requestReason()` resolves to `''` immediately and no
 * dialog appears, so call sites need no branching of their own.
 */
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';

import { api } from '@eboto/backend/api';
import { votingStartAt } from '@eboto/backend/election-timing';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';

/** Mirrors `MIN_CHANGE_REASON_LENGTH` / `MAX_CHANGE_REASON_LENGTH`. */
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 300;

/**
 * Whether voting has opened for the election behind `electionDashboardSlug`.
 * Reads the same query the dashboard shell already loaded, so this is a cache
 * hit rather than a second round trip.
 */
export function useVotingStarted(electionDashboardSlug: string): boolean {
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) return false;
  return Date.now() >= votingStartAt(election);
}

export interface ChangeReasonGate {
  /** True once voting has opened — a reason is required and will be published. */
  live: boolean;
  /**
   * Resolves with the reason to pass to the mutation, or `null` if the
   * commissioner cancelled. Resolves with `''` immediately when not live.
   */
  requestReason: () => Promise<string | null>;
  /** Render this once anywhere in the component's tree. */
  reasonDialog: React.ReactNode;
}

export function useChangeReason(
  electionDashboardSlug: string,
): ChangeReasonGate {
  const live = useVotingStarted(electionDashboardSlug);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  // Held in a ref, not state: resolving the caller's promise is a one-shot
  // side effect and must not be tied to a render.
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  const settle = useCallback((value: string | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(value);
  }, []);

  const requestReason = useCallback((): Promise<string | null> => {
    if (!live) return Promise.resolve('');
    // Abandon any prompt still waiting so an earlier caller can't hang on a
    // promise this one is about to orphan.
    resolverRef.current?.(null);
    resolverRef.current = null;
    setReason('');
    setOpen(true);
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [live]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_REASON_LENGTH;
  const tooLong = trimmed.length > MAX_REASON_LENGTH;

  const reasonDialog = (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Dismissing by overlay/Escape has to cancel the pending promise,
        // otherwise the caller would hang forever.
        if (!next) settle(null);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-4 text-amber-600 dark:text-amber-400" />
            This change will be public
          </DialogTitle>
          <DialogDescription>
            Voting is underway. Your edit is allowed, but it gets recorded on
            this election&apos;s change log — visible to everyone who can see
            the election, alongside your name and the reason you give here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="change-reason">Reason for this change</Label>
          <Textarea
            id="change-reason"
            rows={3}
            autoFocus
            value={reason}
            maxLength={MAX_REASON_LENGTH}
            placeholder="e.g. Correcting a misspelled surname reported by the candidate."
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !tooShort) {
                e.preventDefault();
                settle(trimmed);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            {tooShort
              ? `At least ${MIN_REASON_LENGTH} characters — write it for a voter reading the log later.`
              : `${trimmed.length}/${MAX_REASON_LENGTH}`}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => settle(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={tooShort || tooLong}
            onClick={() => settle(trimmed)}
          >
            Publish change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { live, requestReason, reasonDialog };
}

const ChangeReasonContext = createContext<ChangeReasonGate | null>(null);

/** Shares one page-level gate with every form and row action beneath it. */
export function ChangeReasonProvider({
  value,
  children,
}: {
  value: ChangeReasonGate;
  children: ReactNode;
}) {
  return (
    <ChangeReasonContext.Provider value={value}>
      {children}
    </ChangeReasonContext.Provider>
  );
}

export function useChangeReasonGate(): ChangeReasonGate {
  const gate = useContext(ChangeReasonContext);
  if (!gate) {
    throw new Error(
      'useChangeReasonGate must be used inside a <ChangeReasonProvider>',
    );
  }
  return gate;
}
