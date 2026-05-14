import { useState } from 'react';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';

/**
 * Inline "Report a problem" entry point. The `electionId` (when present)
 * scopes the report so support has the context — otherwise the row is a
 * platform-wide bug.
 */
export function ReportProblemDialog({
  electionId,
  variant = 'outline',
  size = 'sm',
}: {
  electionId?: Id<'elections'>;
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'default';
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const report = useMutation(api.reportedProblems.create);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size}>
            <LifeBuoy className="mr-1.5 size-4" /> Report a problem
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            Tell us what went wrong. Our team gets every report and follows up
            on the email tied to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="report-subject">Subject</Label>
            <Input
              id="report-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly, what's the issue?"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, what you expected, what happened…"
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await report({
                  subject,
                  description,
                  electionId,
                });
                toast.success('Thanks — your report was sent.');
                setOpen(false);
                setSubject('');
                setDescription('');
              } catch (err) {
                toast.error(
                  err instanceof ConvexError
                    ? ((err.data as { message?: string }).message ?? 'Failed')
                    : 'Failed to submit',
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Sending…' : 'Send report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
