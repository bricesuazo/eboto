import React, { Fragment } from "react";
import { Container, Group, Skeleton, Stack } from "@mantine/core";

export default function ElectionPageLoading() {
  return (
    <Container py="xl" size="md">
      <Stack align="center" gap={12}>
        <Stack gap={8} align="center">
          <Group align="center" mb={4}>
            <Skeleton w={92} h={92} />
          </Group>
          <Skeleton w={228} h={28} />
          <Skeleton w={248} h={16} />
          <Skeleton w={372} h={16} />
          <Skeleton w={200} h={16} />
          <Skeleton w={172} h={32} radius="lg" />
        </Stack>

        {[...(Array(8) as number[])].map((_, i) => (
          <Stack key={i} gap={8} align="center" w="100%">
            <Skeleton w={128} h={28} radius="lg" />

            <Group align="center" w="100%" gap={12}>
              {[...(Array(2) as number[])].map((_, i) => (
                <Fragment key={i}>
                  <Skeleton w={200} h={192} radius="md" hiddenFrom="xs" />
                  <Skeleton w="100%" h={128} radius="md" visibleFrom="xs" />
                </Fragment>
              ))}
            </Group>
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
