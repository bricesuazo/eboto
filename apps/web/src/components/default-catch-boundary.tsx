import {
  ErrorComponent,
  type ErrorComponentProps,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ErrorComponent error={error} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => router.invalidate()}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          Try again
        </button>
        {isRoot ? (
          <Link to="/" className="rounded-md border px-4 py-2 text-sm">
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className="rounded-md border px-4 py-2 text-sm"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Go back
          </Link>
        )}
      </div>
    </main>
  );
}
