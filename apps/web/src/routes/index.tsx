import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-12 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        eBoto v2 — coming soon
      </h1>
      <p className="text-muted-foreground max-w-xl">
        Migration in progress: TanStack Start + Convex + shadcn/ui.
      </p>
      <div className="flex gap-3">
        <Link
          to="/sign-in"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
