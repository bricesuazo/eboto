"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateCandidate from "@/components/client/modals/create-candidate";
import DeleteCandidate from "@/components/client/modals/delete-candidate";
import EditCandidate from "@/components/client/modals/edit-candidate";
import classes from "@/styles/Candidate.module.css";
import { api } from "@/trpc/client";
import {
  Anchor,
  Box,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

import type { RouterOutputs } from "@eboto-mo/api";
import type { Election } from "@eboto-mo/db/schema";

export default function DashboardCandidate({
  election,
  positionsWithCandidates,
}: {
  election: Election;
  positionsWithCandidates: RouterOutputs["election"]["getDashboardCandidateData"];
}) {
  const positionsWithCandidatesQuery =
    api.election.getDashboardCandidateData.useQuery(
      { election_id: election.id },
      { initialData: positionsWithCandidates },
    );

  if (!election) notFound();

  return (
    <Stack gap="lg">
      {positionsWithCandidatesQuery.data.length === 0 ? (
        <Box>
          <Text>
            No positions yet. Please add{" "}
            <Anchor
              component={Link}
              href={`/dashboard/${election.slug}/position`}
            >
              positions
            </Anchor>{" "}
            first.
          </Text>
        </Box>
      ) : (
        positionsWithCandidatesQuery.data.map((position) => (
          <Box key={position.id}>
            <Text
              fw="bold"
              size="xl"
              w="100%"
              ta={{ base: "center", sm: "left" }}
            >
              <Balancer>{position.name}</Balancer>
            </Text>

            <ScrollArea scrollbarSize={10} offsetScrollbars="x">
              <Flex gap="md">
                <Box>
                  <CreateCandidate position={position} data-superjson />
                </Box>

                <Flex
                  gap="xs"
                  style={{
                    overflow: "auto",
                    flex: 1,
                  }}
                  align="center"
                >
                  {!position.candidates.length ? (
                    <Box>
                      <Text lineClamp={4}>
                        <Balancer>
                          No candidate in {position.name} yet...
                        </Balancer>
                      </Text>
                    </Box>
                  ) : (
                    position.candidates.map((candidate) => {
                      const title = `${candidate.first_name} ${
                        candidate.middle_name && ` ${candidate.middle_name}`
                      } ${candidate.last_name} (${
                        candidate.partylist.acronym
                      })`;
                      return (
                        <Group
                          key={candidate.id}
                          className={classes["candidate-card"]}
                          // gap="xs"
                          px="md"
                        >
                          <HoverCard openDelay={500} width={256} offset={60}>
                            <HoverCardTarget>
                              <Stack align="center" justify="center" gap="xs">
                                {candidate.image_link ? (
                                  <Image
                                    src={candidate.image_link}
                                    width={100}
                                    height={100}
                                    alt={
                                      candidate.first_name +
                                      " " +
                                      candidate.last_name +
                                      " image"
                                    }
                                    priority
                                    style={{ objectFit: "cover" }}
                                  />
                                ) : (
                                  <IconUser
                                    size={100}
                                    style={{
                                      padding: 8,
                                    }}
                                  />
                                )}
                                <Text ta="center" w="full" lineClamp={1}>
                                  {title}
                                </Text>
                              </Stack>
                            </HoverCardTarget>

                            <Flex gap="xs" align="center">
                              <EditCandidate
                                candidate={candidate}
                                election={election}
                                data-superjson
                              />
                              <DeleteCandidate
                                candidate={candidate}
                                data-superjson
                              />
                            </Flex>
                            <HoverCardDropdown>{title}</HoverCardDropdown>
                          </HoverCard>
                        </Group>
                      );
                    })
                  )}
                </Flex>
              </Flex>
            </ScrollArea>
          </Box>
        ))
      )}
    </Stack>
  );
}
