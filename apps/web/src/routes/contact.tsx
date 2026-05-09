import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="container mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="text-muted-foreground mt-2">
        Email{' '}
        <a className="underline" href="mailto:contact@eboto.app">
          contact@eboto.app
        </a>
        {' '}for support, partnership, or feedback.
      </p>
    </main>
  );
}
