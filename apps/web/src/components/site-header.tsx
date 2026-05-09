import { Link, useRouteContext } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';

import { ModeToggle } from '~/components/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useAuthActions } from '~/lib/auth/provider';

export function SiteHeader() {
  const { user } = useRouteContext({ from: '__root__' });

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-2"
        >
          <img src="/logo.png" alt="eBoto" width={32} height={32} />
          <span className="font-semibold">eBoto</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ModeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button render={<Link to="/sign-in">Sign in</Link>} size="sm" />
          )}
        </nav>
      </div>
    </header>
  );
}

interface UserShape {
  name?: string;
  email?: string;
  image?: string;
}

function UserMenu({ user }: { user: UserShape }) {
  const { signOut } = useAuthActions();

  const initials = (user.name ?? user.email ?? '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');

  async function handleSignOut() {
    await signOut();
    window.location.href = '/sign-in';
  }

  return (
    <>
      <Button
        render={<Link to="/dashboard">Dashboard</Link>}
        variant="ghost"
        size="sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Account menu"
            >
              <Avatar>
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          }
        />

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm">{user.name ?? 'Account'}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? ''}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link to="/dashboard">
                <User className="size-4" />
                My elections
              </Link>
            }
            nativeButton={false}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
