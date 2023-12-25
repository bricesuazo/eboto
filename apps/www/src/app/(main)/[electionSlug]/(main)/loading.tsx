import React, { Fragment } from "react";
import { Container, Flex, Group, Skeleton, Stack } from "@mantine/core";

export default function ElectionPageLoading() {
  return (
    <Container py={40} size="md">
      <Stack align="center" gap={12}>
        <Stack gap={8} align="center">
          <Group align="center" mb={4}>
            <Skeleton w={92} h={92} />
          </Group>
          <Skeleton w={228} h={28} />
          <Skeleton w={248} h={16} />
          <Skeleton w={372} h={16} />
          <Skeleton w={200} h={16} />
          <Flex gap="sm">
            <Skeleton w={172} h={40} radius="xl" />
            <Skeleton w={172} h={40} radius="xl" />
          </Flex>
        </Stack>

        {[...(Array(8) as number[])].map((_, i) => (
          <Stack key={i} gap={8} align="center" w="100%">
            <Group justify="center" align="center" w="100%">
              {[...(Array(2) as number[])].map((_, i) => (
                <Fragment key={i}>
                  <Skeleton w="100%" h={260} radius="md" hiddenFrom="xs" />
                  <Skeleton w={220} h={260} radius="md" visibleFrom="xs" />
                </Fragment>
              ))}
            </Group>
            <Skeleton w={128} h={28} radius="lg" />
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
