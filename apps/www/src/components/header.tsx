'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Modal,
  Pill,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { spotlight } from '@mantine/spotlight';
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconLogout,
  IconMessage,
  IconMoon,
  IconSearch,
  IconSparkles,
  IconSun,
  IconUserCircle,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { ReportAProblem } from '~/schema/report';
import { ReportAProblemSchema } from '~/schema/report';
import { useStore } from '~/store';
import classes from '~/styles/Header.module.css';
import { createClient } from '~/supabase/client';
import { api } from '~/trpc/client';

export default function Header({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const utils = api.useUtils();
  const userQuery = api.auth.getUser.useQuery();
  const params = useParams();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reportAProblemLoading, setReportAProblemLoading] = useState(false);
  const reportAProblemMutation = api.election.reportAProblem.useMutation();

  const electionsQuery = api.election.getAllMyElections.useQuery(undefined, {
    enabled: !!userQuery.data && reportAProblemLoading,
  });

  const { setColorScheme } = useMantineColorScheme();
  const [
    openedReportAProblem,
    { open: openReportAProblem, close: closeReportAProblem },
  ] = useDisclosure(false);

  const [openedMenu, { toggle }] = useDisclosure(false);

  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  const store = useStore();

  const formReportAProblem = useForm<ReportAProblem>({
    initialValues: {
      subject: '',
      description: '',
      election_id: '',
    },
    validate: zod4Resolver(ReportAProblemSchema),
  });

  useEffect(() => {
    if (openedReportAProblem) {
      formReportAProblem.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedReportAProblem]);

  return (
    <>
      <Modal
        opened={openedReportAProblem}
        onClose={closeReportAProblem}
        title="Report a problem"
      >
        <form
          onSubmit={formReportAProblem.onSubmit((values) => {
            if (!values.election_id) return;

            setReportAProblemLoading(true);

            void (async () => {
              if (!values.election_id) return;

              await reportAProblemMutation.mutateAsync({
                subject: values.subject,
                description: values.description,
                election_id: values.election_id,
              });

              notifications.show({
                title: 'Problem reported!',

                message: "We'll get back to you as soon as possible.",
              });
              closeReportAProblem();
              setReportAProblemLoading(false);
            })();
          })}
        >
          <Stack>
            <TextInput
              withAsterisk
              label="Subject"
              placeholder="What's the problem?"
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps('subject')}
            />
            <Textarea
              rows={5}
              withAsterisk
              label="Description"
              placeholder="Explain your concern..."
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps('description')}
            />
            <Select
              label="Election"
              placeholder="Select an election"
              withAsterisk
              data={
                electionsQuery.data?.map(({ election }) => ({
                  value: election.id,
                  label: election.name,
                })) ?? []
              }
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps('election_id')}
            />
            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                disabled={!formReportAProblem.isValid()}
                loading={reportAProblemLoading}
              >
                Submit
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Container h="100%" fluid={!!params.electionDashboardSlug}>
        <Flex h="100%" align="center" justify="space-between" gap="xs">
          <Flex h="100%" align="center" gap="xs">
            <UnstyledButton
              component={Link}
              href={isLoggedIn ? '/dashboard' : '/'}
            >
              <Flex gap="xs" align="center">
                <Image
                  src="/images/logo.png"
                  alt="eBoto Logo"
                  width={32}
                  height={32}
                  priority
                />
                <Text fw={600} visibleFrom="xs">
                  eBoto
                </Text>
              </Flex>
            </UnstyledButton>

            <Center h="100%" hiddenFrom="xs">
              <Burger
                opened={store.dashboardMenu}
                onClick={() => store.toggleDashboardMenu()}
                size="sm"
                color="gray.6"
                py="xl"
                h="100%"
                hidden={!params.electionDashboardSlug}
              />
            </Center>
          </Flex>

          {isLoggedIn ? (
            <Flex
              align="center"
              gap={{
                base: 'sm',
                xs: 'lg',
              }}
            >
              <TextInput
                onClick={spotlight.open}
                leftSection={<IconSearch size="1.25rem" />}
                radius="xl"
                w={140}
                readOnly
                placeholder="Search"
                hiddenFrom="sm"
                visibleFrom="xs"
              />
              <TextInput
                onClick={spotlight.open}
                leftSection={<IconSearch size="1.25rem" />}
                rightSection={<Pill>Ctrl + K</Pill>}
                radius="xl"
                w={200}
                readOnly
                rightSectionWidth={80}
                placeholder="Search"
                visibleFrom="sm"
              />
              <Menu
                position="bottom-end"
                opened={openedMenu}
                onChange={toggle}
                withinPortal
                width={200}
              >
                <MenuTarget>
                  <UnstyledButton h="100%">
                    <Flex gap="xs" align="center">
                      <Box
                        style={{
                          position: 'relative',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          width: 24,
                          height: 24,
                        }}
                      >
                        {!userQuery.isLoading ? (
                          userQuery.data?.db.image_url ? (
                            <Image
                              src={userQuery.data.db.image_url}
                              alt="Profile picture"
                              fill
                              sizes="100%"
                              priority
                              style={{
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <IconUserCircle />
                          )
                        ) : (
                          <Skeleton w={24} h={24} />
                        )}
                      </Box>

                      <Box w={{ base: 100, sm: 140 }}>
                        {userQuery.data ? (
                          <>
                            <Text size="xs" truncate fw="bold">
                              {userQuery.data.db.name}
                            </Text>
                            <Text size="xs" truncate>
                              {userQuery.data.db.email}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Skeleton h={12} my={4} />
                            <Skeleton h={12} my={4} />
                          </>
                        )}
                      </Box>

                      <IconChevronDown
                        size={16}
                        style={{
                          rotate: openedMenu ? '-180deg' : '0deg',
                          transition: 'all 0.25s',
                        }}
                      />
                    </Flex>
                  </UnstyledButton>
                </MenuTarget>

                <MenuDropdown>
                  <MenuItem
                    component={Link}
                    href="/dashboard"
                    leftSection={<IconChartBar size={16} />}
                  >
                    Dashboard
                  </MenuItem>

                  <MenuItem
                    component={Link}
                    href="/account"
                    leftSection={<IconUserCircle size={16} />}
                  >
                    Account settings
                  </MenuItem>

                  <MenuItem
                    component={Link}
                    href="/pricing"
                    leftSection={<IconSparkles size={16} />}
                  >
                    Pricing
                  </MenuItem>

                  <MenuItem
                    leftSection={
                      computedColorScheme === 'light' ? (
                        <IconMoon size={16} />
                      ) : (
                        <IconSun size={16} />
                      )
                    }
                    onClick={() =>
                      setColorScheme(
                        computedColorScheme === 'light' ? 'dark' : 'light',
                      )
                    }
                    closeMenuOnClick={false}
                  >
                    {computedColorScheme === 'light'
                      ? 'Dark mode'
                      : 'Light mode'}
                  </MenuItem>
                  <MenuItem
                    leftSection={<IconAlertCircle size={16} />}
                    onClick={openReportAProblem}
                  >
                    Report a problem
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setLogoutLoading(true);
                      const supabase = createClient();

                      await supabase.auth.signOut();
                      router.push('/sign-in');
                      await utils.auth.invalidate();
                    }}
                    closeMenuOnClick={false}
                    leftSection={
                      logoutLoading ? (
                        <Loader size={16} m={0} />
                      ) : (
                        <IconLogout
                          style={{
                            transform: 'translateX(2px)',
                          }}
                          size={16}
                        />
                      )
                    }
                    disabled={logoutLoading}
                  >
                    Log out
                  </MenuItem>
                </MenuDropdown>
              </Menu>
              {params.electionDashboardSlug && (
                <ActionIcon
                  variant={store.dashboardChatMenu ? 'light' : 'subtle'}
                  hiddenFrom="lg"
                  size="lg"
                  onClick={() => store.toggleDashboardChatMenu()}
                >
                  <IconMessage />
                </ActionIcon>
              )}
            </Flex>
          ) : (
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                size={36}
                onClick={() =>
                  setColorScheme(
                    computedColorScheme === 'light' ? 'dark' : 'light',
                  )
                }
              >
                <IconSun size="1rem" className={classes.light} />
                <IconMoon size="1rem" className={classes.dark} />
              </ActionIcon>

              <Button hiddenFrom="sm" component={Link} href="/sign-in">
                Sign in
              </Button>
              <Button
                variant="outline"
                visibleFrom="sm"
                component={Link}
                href="/sign-in"
              >
                Sign in
              </Button>

              <Button visibleFrom="sm" component={Link} href="/register">
                Get Started
              </Button>
            </Group>
          )}
        </Flex>
      </Container>
    </>
  );
}
