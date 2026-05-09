import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
      >
        Back home
      </Link>
    </main>
  );
}
