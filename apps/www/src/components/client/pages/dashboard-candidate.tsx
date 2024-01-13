"use client";

import { useState } from "react";
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
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

import type { RouterOutputs } from "@eboto/api";
import { formatName } from "@eboto/constants";
import type { Election } from "@eboto/db/schema";

export default function DashboardCandidate({
  election,
  positionsWithCandidates,
}: {
  election: Election;
  positionsWithCandidates: RouterOutputs["candidate"]["getDashboardData"];
}) {
  const positionsWithCandidatesQuery = api.candidate.getDashboardData.useQuery(
    { election_id: election.id },
    {
      initialData: positionsWithCandidates,
    },
  );

  const getNameArrangementQuery = api.candidate.getNameArrangement.useQuery(
    {
      election_id: election.id,
    },
    {
      initialData: election.name_arrangement,
    },
  );

  const [nameArangement, setNameArrangement] = useState(
    getNameArrangementQuery.data,
  );

  const editNameArrangementMutation =
    api.candidate.editNameArrangement.useMutation({
      onMutate: ({ name_arrangement }) => {
        setNameArrangement(name_arrangement);
      },
    });

  if (!election) notFound();

  return (
    <Stack gap="lg">
      <Select
        label="Candidate's name arrangement"
        placeholder="Pick name arrangement"
        disabled={editNameArrangementMutation.isPending}
        value={nameArangement.toString()}
        onChange={(e) => {
          if (!e) return;

          editNameArrangementMutation.mutate({
            election_id: election.id,
            name_arrangement: parseInt(e),
          });
        }}
        data={[
          { value: "0", label: "First name Middle name Last name" },
          { value: "1", label: "Last name, First name Middle name" },
        ]}
      />
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
                  <CreateCandidate position={position} />
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
                      const title = `${formatName(
                        election.name_arrangement,
                        candidate,
                      )} (${candidate.partylist.acronym})`;
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
                                {candidate.image ? (
                                  <Image
                                    src={candidate.image.url}
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
                              />
                              <DeleteCandidate
                                candidate={candidate}
                                name_arrangement={getNameArrangementQuery.data}
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
