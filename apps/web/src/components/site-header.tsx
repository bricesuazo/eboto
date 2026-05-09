import { Link, useRouteContext, useRouter } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useAuthActions } from '~/lib/auth/provider';
import { AUTH_QUERY_KEY } from '~/lib/constants';

export function SiteHeader() {
  const { user } = useRouteContext({ from: '__root__' });

  return (
    <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-bold tracking-tight">
          eBoto
        </Link>

        <nav className="flex items-center gap-2">
          {user ? <UserMenu user={user} /> : <SignedOutNav />}
        </nav>
      </div>
    </header>
  );
}

function SignedOutNav() {
  return (
    <Button asChild size="sm">
      <Link to="/sign-in">Sign in</Link>
    </Button>
  );
}

interface UserShape {
  name?: string;
  email?: string;
  image?: string;
}

function UserMenu({ user }: { user: UserShape }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const { queryClient } = useRouteContext({ from: '__root__' });

  const initials = (user.name ?? user.email ?? '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');

  async function handleSignOut() {
    await signOut();
    // Bust the cached server-auth lookup so the next navigation re-fetches
    // and reflects the signed-out state.
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    await router.invalidate();
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard">Dashboard</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Account menu"
          >
            <Avatar>
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm">{user.name ?? 'Account'}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email ?? ''}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/dashboard">
              <User className="size-4" />
              My elections
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
