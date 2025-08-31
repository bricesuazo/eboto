'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ActionIcon,
  Box,
  Center,
  Divider,
  Flex,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useHover } from '@mantine/hooks';
import {
  IconCheck,
  IconExternalLink,
  IconLock,
  IconUsersGroup,
  IconWorldWww,
  IconX,
} from '@tabler/icons-react';
import moment from 'moment';

import type { RouterOutputs } from '@eboto/api';
import { parseHourTo12HourFormat } from '@eboto/constants';

import classes from '~/styles/Dashboard.module.css';

export default function DashboardCard(
  props:
    | {
        election: RouterOutputs['election']['getMyElectionAsCommissioner'][number];
        type: 'manage';
      }
    | {
        election: RouterOutputs['election']['getMyElectionAsVoter'][number];
        type: 'vote';
        votes: RouterOutputs['election']['getMyElectionAsVoter'][number]['votes'];
      },
) {
  const [
    opened,
    {
      // open,
      close,
    },
  ] = useDisclosure(false);
  const { hovered, ref } = useHover<HTMLAnchorElement>();

  return (
    <>
      {props.type === 'vote' && props.votes.length > 0 && (
        <Modal opened={opened} onClose={close} title="Votes">
          <Stack>
            <Box>
              {props.election.positions.map((position, index) => (
                <Box key={position.id}>
                  <Text lineClamp={1}>{position.name}</Text>

                  {/* {JSON.stringify(props.votes)} */}
                  {/* <List listStyleType="none">
                    {props.votes
                      .filter((vote) => vote.candidate_id=== 
                      .votes.map((candidateId) => {
                        const candidate = position.candidates.find(
                          (candidate) => candidate.id === candidateId,
                        );

                        return candidate ? (
                          <ListItem
                            key={candidateId}
                            fw={600}
                            fz="lg"
                            style={{ lineClamp: 2 }}
                          >
                            {formatName(
                              election.name_arrangement,
                              candidate,
                              true,
                            )}{" "}
                            ({candidate.partylist.acronym})
                          </ListItem>
                        ) : (
                          <ListItem key={candidateId} fw={600} fz="lg">
                            Abstain
                          </ListItem>
                        );
                      })}
                  </List> */}

                  {index !== props.election.positions.length - 1 && (
                    <Divider my="sm" />
                  )}
                </Box>
              ))}
            </Box>
          </Stack>
        </Modal>
      )}
      <UnstyledButton
        ref={ref}
        className={classes['card-container']}
        maw={288}
        w="100%"
        h={
          // props.type === "vote" ? 460 :
          400
        }
        p="md"
        component={Link}
        href={
          (props.type === 'vote'
            ? `/${props.election.slug}`
            : `/dashboard/${props.election.slug}`) as Route
        }
        target={props.type === 'vote' ? '_blank' : undefined}
        style={{
          borderColor:
            props.election.is_free === false && props.type === 'manage'
              ? 'var(--mantine-color-green-5)'
              : undefined,
        }}
      >
        {props.type === 'vote' && (
          <ActionIcon
            variant="default"
            disabled
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              width: 32,
              height: 32,
              borderRadius: '100%',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 100ms ease-in-out',
              pointerEvents: 'none',
            }}
          >
            <IconExternalLink size="1rem" />
          </ActionIcon>
        )}

        {props.election.logo_url && (
          <Box
            mx="auto"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              // maxWidth: 256,
            }}
          >
            <Image
              src={props.election.logo_url}
              alt={props.election.name + ' logo'}
              fill
              sizes="100%"
              style={{
                objectFit: 'cover',
              }}
              priority
              blurDataURL={props.election.logo_url}
            />
            <Flex
              gap="xs"
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%) translateY(50%)',
              }}
            >
              <HoverCard width={200} openDelay={200} closeDelay={0}>
                <HoverCardTarget>
                  <Box
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--mantine-color-green-filled)',
                      borderRadius: '100%',
                      width: 48,
                      height: 48,
                    }}
                  >
                    {(() => {
                      switch (props.election.publicity) {
                        case 'PRIVATE':
                          return <IconLock color="white" />;
                        case 'VOTER':
                          return <IconUsersGroup color="white" />;
                        case 'PUBLIC':
                          return <IconWorldWww color="white" />;
                      }
                    })()}
                  </Box>
                </HoverCardTarget>
                <HoverCardDropdown>
                  <Text size="sm">
                    Publicity:{' '}
                    {(() => {
                      switch (props.election.publicity) {
                        case 'PRIVATE':
                          return 'Private (Only commissioners can see this election)';
                        case 'VOTER':
                          return 'Voter (Only commissioners and voters can see this election)';
                        case 'PUBLIC':
                          return 'Public (Everyone can see this election)';
                      }
                    })()}
                  </Text>
                </HoverCardDropdown>
              </HoverCard>
              {props.type === 'vote' && (
                <HoverCard width={200} openDelay={200} closeDelay={0}>
                  <HoverCardTarget>
                    <Box
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor:
                          props.votes.length > 0
                            ? 'var(--mantine-color-green-filled)'
                            : 'var(--mantine-color-red-filled)',
                        borderRadius: '100%',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {props.votes.length > 0 ? (
                        <IconCheck color="white" />
                      ) : (
                        <IconX color="white" />
                      )}
                    </Box>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="sm">
                      {props.votes.length > 0
                        ? 'You have voted in this election'
                        : 'You have not voted in this election'}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard>
              )}
            </Flex>
          </Box>
        )}
        <Center style={{ flex: 1 }}>
          <Box>
            {!props.election.logo_url && (
              <Flex gap="xs" justify="center" mb="sm">
                <HoverCard width={200} openDelay={200} closeDelay={0}>
                  <HoverCardTarget>
                    <Box
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--mantine-color-green-filled)',
                        borderRadius: '100%',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {(() => {
                        switch (props.election.publicity) {
                          case 'PRIVATE':
                            return <IconLock color="white" />;
                          case 'VOTER':
                            return <IconUsersGroup color="white" />;
                          case 'PUBLIC':
                            return <IconWorldWww color="white" />;
                        }
                      })()}
                    </Box>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="sm">
                      Publicity:{' '}
                      {(() => {
                        switch (props.election.publicity) {
                          case 'PRIVATE':
                            return 'Private (Only commissioners can see this election)';
                          case 'VOTER':
                            return 'Voter (Only commissioners and voters can see this election)';
                          case 'PUBLIC':
                            return 'Public (Everyone can see this election)';
                        }
                      })()}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard>
                {props.type === 'vote' && (
                  <HoverCard width={200} openDelay={200} closeDelay={0}>
                    <HoverCardTarget>
                      <Box
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor:
                            props.votes.length > 0
                              ? 'var(--mantine-color-green-filled)'
                              : 'var(--mantine-color-red-filled)',
                          borderRadius: '100%',
                          width: 48,
                          height: 48,
                        }}
                      >
                        {props.votes.length > 0 ? (
                          <IconCheck color="white" />
                        ) : (
                          <IconX color="white" />
                        )}
                      </Box>
                    </HoverCardTarget>
                    <HoverCardDropdown>
                      <Text size="sm">
                        {props.votes.length > 0
                          ? 'You have voted in this election'
                          : 'You have not voted in this election'}
                      </Text>
                    </HoverCardDropdown>
                  </HoverCard>
                )}
              </Flex>
            )}

            <Text fw="bold" ta="center" fz="xl" lineClamp={2} lh="xs" w="100%">
              {props.election.name}
            </Text>
            <Text size="sm" c="GrayText" ta="center">
              {moment(props.election.start_date).local().format('MMM DD, YYYY')}
              {' - '}
              {moment(props.election.end_date).local().format('MMM DD, YYYY')}
            </Text>
            <Text size="sm" c="GrayText" ta="center">
              {props.election.voting_hour_start === 0 &&
              props.election.voting_hour_end === 24
                ? 'Whole day'
                : parseHourTo12HourFormat(props.election.voting_hour_start) +
                  ' - ' +
                  parseHourTo12HourFormat(props.election.voting_hour_end)}
            </Text>

            {/* {props.type === "vote" && props.votes.length > 0 && (
              <Center mt="sm">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    open();
                  }}
                  variant="default"
                  radius="xl"
                >
                  See your votes
                </Button>
              </Center>
            )} */}
          </Box>
        </Center>
      </UnstyledButton>
    </>
  );
}
