import { useEffect, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { CreditCard, LifeBuoy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';

export const Route = createFileRoute('/account/')({
  head: () => ({
    meta: [{ title: 'Account | eBoto' }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const { data: user } = useQuery(convexQuery(api.users.current, {}));
  const updateProfile = useMutation(api.users.updateProfile);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, billing, and account state.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" render={<Link to="/account/billing" />}>
          <CreditCard className="size-4" /> Billing
        </Button>
        <Button variant="outline" size="sm" render={<Link to="/account/reports" />}>
          <LifeBuoy className="size-4" /> My reports
        </Button>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Email is set by your sign-in provider and can't be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ''} readOnly disabled />
          </div>
          <form
            className="space-y-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await updateProfile({ name });
                toast.success('Profile updated.');
              } catch (err) {
                toast.error(
                  err instanceof ConvexError
                    ? ((err.data as { message?: string }).message ?? 'Failed')
                    : 'Failed',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <Label htmlFor="account-name">Display name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="What should we call you?"
            />
            <Button type="submit" size="sm" disabled={saving} className="mt-2">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting your account anonymizes your profile and ends your
            sessions. Elections you commissioned are not deleted — coordinate
            with your co-commissioners or delete the elections first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={async () => {
              if (
                !confirm(
                  'Delete your account? This anonymizes your profile and signs you out.',
                )
              )
                return;
              setDeleting(true);
              try {
                await deleteAccount({});
                await signOut();
                toast.success('Account deleted.');
                await navigate({ to: '/' });
              } catch (err) {
                toast.error(
                  err instanceof ConvexError
                    ? ((err.data as { message?: string }).message ?? 'Failed')
                    : 'Failed',
                );
              } finally {
                setDeleting(false);
              }
            }}
          >
            <Trash2 className="size-4" />
            {deleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
