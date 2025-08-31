'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Group, Skeleton, Stack, Tabs, TabsList, TabsTab } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconX } from '@tabler/icons-react';

export default function DashboardTab({
  children,
  type,
  defaultValue,
}: {
  children: React.ReactNode;
  type: 'vote' | 'manage';
  defaultValue: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const manage = Array.isArray(searchParams.get('manage'))
    ? searchParams.get('manage')?.[0]
    : searchParams.get('manage');
  const vote = Array.isArray(searchParams.get('vote'))
    ? searchParams.get('vote')?.[0]
    : searchParams.get('vote');

  return (
    <Tabs
      defaultValue={defaultValue}
      inverted
      onChange={(value) => {
        const searchParams = new URLSearchParams(window.location.search);

        if (type === 'vote') {
          if (value) searchParams.set('vote', value);
          if (manage) searchParams.set('manage', manage);
        } else {
          if (value) searchParams.set('manage', value);
          if (vote) searchParams.set('vote', vote);
        }

        router.push(`/dashboard?${searchParams.toString()}`);
      }}
    >
      <Stack>
        <TabsList grow>
          <TabsTab value="ongoing" leftSection={<IconArrowDown />}>
            Ongoing
          </TabsTab>
          <TabsTab value="upcoming" leftSection={<IconArrowUp />}>
            Upcoming
          </TabsTab>
          <TabsTab value="ended" leftSection={<IconX />}>
            Ended
          </TabsTab>
        </TabsList>
        <Suspense
          fallback={
            <Group>
              {[...Array(3).keys()].map((i) => (
                <Skeleton key={i} maw={288} h={400} radius="md" />
              ))}
            </Group>
          }
        >
          {children}
        </Suspense>
      </Stack>
    </Tabs>
  );
}
