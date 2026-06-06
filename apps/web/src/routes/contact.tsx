import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { AtSign, MapPin, Phone, Sun } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '~/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

const schema = z.object({
  name: z.string().optional(),
  email: z.email('Enter a valid email'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message should be at least 10 characters long'),
});

type FormValues = z.infer<typeof schema>;

const CONTACT_INFO = [
  { title: 'Email', value: 'contact@eboto.app', Icon: AtSign },
  { title: 'Phone', value: '+63 961 719 6607', Icon: Phone },
  { title: 'Address', value: 'Philippines', Icon: MapPin },
  { title: 'Working hours', value: '10AM – 7PM (PHT)', Icon: Sun },
];

function ContactPage() {
  return (
    <main className="container mx-auto max-w-5xl px-6 py-16">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="mx-auto max-w-prose text-muted-foreground">
          We are happy to answer any questions you may have. Please reach out to
          us and we will respond as soon as we can.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid md:grid-cols-2">
          <ContactInfoPanel />
          <ContactFormPanel />
        </div>
      </div>
    </main>
  );
}

function ContactInfoPanel() {
  return (
    <div className="relative bg-emerald-700 p-8 text-white md:p-10">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.25),transparent_60%)]"
      />
      <div className="relative">
        <h2 className="text-lg font-bold">Contact information</h2>
        <ul className="mt-6 space-y-5">
          {CONTACT_INFO.map(({ title, value, Icon }) => (
            <li key={title} className="flex items-start gap-4">
              <Icon className="mt-1 size-5 shrink-0 opacity-90" />
              <div>
                <div className="text-xs  text-white/70 uppercase">
                  {title}
                </div>
                <div className="text-sm">{value}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ContactFormPanel() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: values.name?.trim() ? values.name.trim() : undefined,
          email: values.email,
          subject: values.subject,
          message: values.message,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? 'Failed to send message');
      }
      toast.success('Message sent. We will get back to you soon.');
      form.reset();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.',
      );
    }
  }

  return (
    <div className="p-8 md:p-10">
      <h2 className="text-lg font-bold">Get in touch</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Subject <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Subject"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Your message <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="Please include all relevant information"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
