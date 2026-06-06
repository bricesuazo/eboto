export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="prose prose-neutral dark:prose-invert mt-6 text-sm leading-relaxed">
        {children}
      </div>
    </main>
  );
}
