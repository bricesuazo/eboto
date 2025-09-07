'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Adsense } from '@ctrl/react-adsense';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import {
  IconClock,
  IconFingerprint,
  IconInfoCircle,
  IconQrcode,
  IconUser,
} from '@tabler/icons-react';
import moment from 'moment';
import ReactPlayer from 'react-player';
import Balancer from 'react-wrap-balancer';

import type { RouterOutputs } from '@eboto/api';
import {
  formatName,
  isElectionEnded,
  isElectionOngoing,
  parseHourTo12HourFormat,
} from '@eboto/constants';

import ScrollToTopButton from '~/components/scroll-to-top';
import classes from '~/styles/Election.module.css';
import { api } from '~/trpc/client';
import AdModal from '../ad-modal';
import MessageCommissioner from '../modals/message-commissioner';
import QRCodeModal from '../modals/qr-code';
import MyMessagesElection from '../my-messages-election';

export default function ElectionPage({
  data,
  election_slug,
  is_free,
}: {
  data: RouterOutputs['election']['getElectionPage'];
  election_slug: string;
  is_free: boolean;
}) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [spoilerOpened, { open: setSpoilerOpen, close: setSpoilerClose }] =
    useDisclosure(false);
  const [openedQrCode, { open: openQrCode, close: closeQrCode }] =
    useDisclosure(false);

  const addVoterFieldToVoterMutation =
    api.voter.addVoterFieldToVoter.useMutation({
      onSuccess: () => {
        router.push(`/${election_slug}/vote`);
        close();
      },
    });
  const {
    data: { election, positions, hasVoted, myVoterData, isVoterCanMessage },
  } = api.election.getElectionPage.useQuery(
    { election_slug },
    { initialData: data },
  );

  const form = useForm<Record<string, string>>({
    initialValues: Object.fromEntries(
      election.voter_fields.map((field) => [
        field.id,
        myVoterData?.field?.[field.id] ?? '',
      ]),
    ),
    validate: (values) => {
      const errors: Record<string, string> = {};
      election.voter_fields.forEach((field) => {
        if (!values[field.id]) {
          errors[field.id] = `${field.name} is required`;
        }
      });
      return errors;
    },
  });
  useEffect(() => {
    if (opened) {
      form.reset();
      addVoterFieldToVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const [value, setValue] = useLocalStorage<boolean>({
    key: `${election.id}_show_voter_tutorial`,
    defaultValue: true,
  });

  return (
    <>
      {is_free && <AdModal />}
      <ScrollToTopButton />
      {!is_free && isVoterCanMessage && (
        <MyMessagesElection election_id={election.id} />
      )}
      <Modal
        opened={opened || addVoterFieldToVoterMutation.isPending}
        onClose={close}
        title="Fill up this form first before voting."
        closeOnClickOutside={false}
        centered
      >
        <form
          onSubmit={form.onSubmit((value) =>
            addVoterFieldToVoterMutation.mutate({
              election_id: election.id,
              voter_id: myVoterData?.id ?? '',
              fields: Object.entries(value).map(([key, value]) => ({
                id: key,
                value,
              })),
            }),
          )}
        >
          <Stack gap="sm">
            {Object.entries(form.values).map(([key]) => {
              const field = election.voter_fields.find(
                (field) => field.id === key,
              );
              if (!field) return null;
              return (
                <TextInput
                  key={key}
                  required
                  label={field.name}
                  placeholder={field.name}
                  {...form.getInputProps(key)}
                />
              );
            })}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={addVoterFieldToVoterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={addVoterFieldToVoterMutation.isPending}
              >
                Start voting
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={value}
        onClose={() => setValue(false)}
        title="Voter Tutorial"
        size="lg"
        closeOnClickOutside={false}
      >
        <Stack>
          <Box style={{ aspectRatio: 16 / 9 }}>
            <ReactPlayer
              src="https://www.youtube.com/watch?v=soAqhLB5xLs"
              width="100%"
              height="100%"
              controls
            />
          </Box>

          <Button w="100%" onClick={() => setValue(false)}>
            Close
          </Button>
        </Stack>
      </Modal>

      <QRCodeModal
        election={election}
        closeAction={closeQrCode}
        opened={openedQrCode}
      />

      <Container pt={40} pb={80} size="md" mb={80}>
        <Stack align="center" gap="md">
          <Box>
            <Flex justify="center" mb={8}>
              {election.logo_url ? (
                <Image
                  src={election.logo_url}
                  alt="Logo"
                  width={128}
                  height={128}
                  priority
                  sizes="100%"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <IconFingerprint size={128} style={{ padding: 8 }} />
              )}
            </Flex>
            <Title order={1} ta="center" maw={600} mb={4}>
              <Balancer>
                {election.name} (@{election.slug}){' '}
                <ActionIcon
                  onClick={openQrCode}
                  variant="outline"
                  color="#2f9e44"
                  size="lg"
                  radius="xl"
                >
                  <IconQrcode size={20} />
                </ActionIcon>
              </Balancer>
            </Title>
            <Text ta="center">
              <Balancer>
                {moment(election.start_date).local().format('MMMM DD, YYYY')}
                {' - '}
                {moment(election.end_date).local().format('MMMM DD, YYYY')}
              </Balancer>
            </Text>
            <Text ta="center">
              Voting hours:{' '}
              {election.voting_hour_start === 0 &&
              election.voting_hour_end === 24
                ? 'Whole day'
                : parseHourTo12HourFormat(election.voting_hour_start) +
                  ' - ' +
                  parseHourTo12HourFormat(election.voting_hour_end)}
            </Text>
            <Flex align="center" justify="center" gap="xs">
              <Text ta="center">
                Publicity:{' '}
                {election.publicity.charAt(0) +
                  election.publicity.slice(1).toLowerCase()}{' '}
              </Text>
              <HoverCard width={180} shadow="md">
                <HoverCardTarget>
                  <ActionIcon
                    size="xs"
                    color="gray"
                    variant="subtle"
                    radius="xl"
                    aria-label="Publicity information"
                  >
                    <IconInfoCircle />
                  </ActionIcon>
                </HoverCardTarget>
                <HoverCardDropdown>
                  <Text size="sm">
                    <Balancer>
                      {(() => {
                        switch (election.publicity) {
                          case 'PRIVATE':
                            return 'Only commissioners can see this election';
                          case 'VOTER':
                            return 'Only voters and commissioners can see this election';
                          case 'PUBLIC':
                            return 'Everyone can see this election';
                          default:
                            return null;
                        }
                      })()}
                    </Balancer>
                  </Text>
                </HoverCardDropdown>
              </HoverCard>
            </Flex>
            {election.description && election.description.length > 0 && (
              <Box maw="40rem" mt="sm" ta="center">
                <Text>About this election:</Text>
                <Text lineClamp={spoilerOpened ? undefined : 3}>
                  {election.description}
                </Text>
                {election.description.length > 200 && (
                  <Anchor
                    onClick={spoilerOpened ? setSpoilerClose : setSpoilerOpen}
                  >
                    {spoilerOpened ? 'Show less' : 'Show more'}
                  </Anchor>
                )}
              </Box>
            )}
            <Flex justify="center" gap="xs" wrap="wrap" mt={8} align="center">
              {(election.publicity === 'PUBLIC' ||
                hasVoted ||
                isElectionEnded({ election })) && (
                <Button
                  radius="xl"
                  size="md"
                  component={Link}
                  leftSection={<IconClock />}
                  href={{ pathname: `/${election.slug}/realtime` }}
                >
                  Realtime count
                </Button>
              )}
              {isElectionOngoing({ election }) && !hasVoted && (
                <>
                  {election.voter_fields.length > 0 &&
                  Object.values(myVoterData?.field ?? {}).every(
                    (value) => value.trim() === '',
                  ) ? (
                    <Button
                      onClick={open}
                      radius="xl"
                      size="md"
                      leftSection={<IconFingerprint />}
                    >
                      Vote now!
                    </Button>
                  ) : (
                    <Button
                      radius="xl"
                      size="md"
                      leftSection={<IconFingerprint />}
                      component={Link}
                      href={{ pathname: `/${election.slug}/vote` }}
                    >
                      Vote now!
                    </Button>
                  )}
                </>
              )}
            </Flex>
            {isElectionEnded({ election }) ? (
              <Text ta="center" p="md">
                This election has ended
              </Text>
            ) : (
              !isElectionOngoing({ election }) && (
                <Text c="red" ta="center" p="md">
                  Voting is not yet open
                </Text>
              )
            )}
            {!is_free && isVoterCanMessage && (
              <Center mt="xs">
                <MessageCommissioner election_id={election.id} />
              </Center>
            )}
          </Box>
          {is_free && (
            <Adsense
              style={{
                display: 'block',
                width: '100%',
              }}
              client="ca-pub-8867310433048493"
              slot="6949415137"
              format="auto"
              responsive="true"
            />
          )}
          <Stack gap="xl" w="100%">
            {positions.length === 0 ? (
              <Text ta="center">
                <Balancer>
                  This election has no positions. Please contact the election
                  commissioner for more information.
                </Balancer>
              </Text>
            ) : (
              positions.map((position) => (
                <Stack gap={0} key={position.id}>
                  <Flex
                    wrap="wrap"
                    align="center"
                    justify="center"
                    gap="xs"
                    py="xs"
                    style={{
                      position: 'sticky',
                      top: 60,
                      zIndex: 1,
                      backgroundColor: 'var(--mantine-color-body)',
                    }}
                  >
                    <Title
                      order={2}
                      tw="bold"
                      ta="center"
                      style={{ lineClamp: 2, wordBreak: 'break-word' }}
                    >
                      <Balancer>{position.name}</Balancer>
                    </Title>
                    <HoverCard width={240} shadow="md">
                      <HoverCardTarget>
                        <ActionIcon
                          size="sm"
                          color="gray"
                          variant="subtle"
                          radius="xl"
                        >
                          <IconInfoCircle />
                        </ActionIcon>
                      </HoverCardTarget>
                      <HoverCardDropdown>
                        <Text size="sm">
                          <Balancer>
                            {position.min === 0 && position.max === 1
                              ? `Voters can only vote 1 candidate for ${position.name}`
                              : `Voters can vote minimum of ${position.min} and maximum of ${position.max} candidates for ${position.name}`}
                          </Balancer>
                        </Text>
                      </HoverCardDropdown>
                    </HoverCard>
                  </Flex>

                  <Group justify="center" gap="sm">
                    {!position.candidates.length ? (
                      <Text fz="lg" ta="center">
                        <Balancer>
                          No candidates for {position.name} yet.
                        </Balancer>
                      </Text>
                    ) : (
                      position.candidates.map((candidate) => {
                        const candidate_name = `${formatName(
                          election.name_arrangement,
                          candidate,
                        )} (${candidate.partylist.acronym})`;
                        return (
                          <UnstyledButton
                            key={candidate.id}
                            component={Link}
                            href={{
                              pathname: `/${election.slug}/${candidate.slug}`,
                            }}
                            className={classes['candidate-card']}
                            h="100%"
                          >
                            <Center
                              pos="relative"
                              style={{
                                aspectRatio: 1,
                                flex: 1,
                                height: '100%',
                                width: '100%',
                              }}
                            >
                              {candidate.image_url ? (
                                <Image
                                  src={candidate.image_url}
                                  alt="Candidate's image"
                                  fill
                                  sizes="100%"
                                  style={{ objectFit: 'cover' }}
                                  priority
                                />
                              ) : (
                                <IconUser size={92} width="100%" />
                              )}
                            </Center>

                            <Box px="xs" py="sm" w="100%">
                              <Text
                                lineClamp={2}
                                ta="center"
                                size="lg"
                                visibleFrom="xs"
                                h={60}
                              >
                                {candidate_name}
                              </Text>
                              <Text
                                lineClamp={2}
                                ta="center"
                                size="lg"
                                hiddenFrom="xs"
                                h={60}
                              >
                                {candidate_name}
                              </Text>
                            </Box>
                          </UnstyledButton>
                        );
                      })
                    )}
                  </Group>
                </Stack>
              ))
            )}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
