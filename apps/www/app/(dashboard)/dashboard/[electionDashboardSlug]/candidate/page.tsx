import CreateCandidate from "@/components/client/modals/create-candidate";
import DeleteCandidate from "@/components/client/modals/delete-candidate";
import EditCandidate from "@/components/client/modals/edit-candidate";
import classes from "@/styles/Candidate.module.css";
import { db } from "@eboto-mo/db";
import { Anchor, Box, Group, Stack, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Balancer from "react-wrap-balancer";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
  });

  if (!election) notFound();

  // const positionsWithCandidates =
  //   await electionCaller.getAllCandidatesByElectionId({
  //     election_id: election.id,
  //   });
  // const partylists = await electionCaller.getAllPartylistsByElectionId({
  //   election_id: election.id,
  // });
  // const positions = await electionCaller.getAllPositionsByElectionId({
  //   election_id: election.id,
  // });
  const positionsWithCandidates = await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, election.id),
    orderBy: (positions, { asc }) => asc(positions.order),
    with: {
      candidates: {
        with: {
          partylist: true,
          credential: {
            columns: {
              id: true,
            },
            with: {
              affiliations: {
                columns: {
                  id: true,
                  org_name: true,
                  org_position: true,
                  start_year: true,
                  end_year: true,
                },
              },
              achievements: {
                columns: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
              events_attended: {
                columns: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
            },
          },
          platforms: {
            columns: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });
  const partylists = await db.query.partylists.findMany({
    where: (partylists, { eq }) => eq(partylists.election_id, election.id),
    orderBy: (partylists, { asc }) => asc(partylists.created_at),
  });

  const positions = await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, election.id),
    orderBy: (positions, { asc }) => asc(positions.order),
  });

  return (
    <Stack gap="lg">
      {positionsWithCandidates.length === 0 ? (
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
        positionsWithCandidates.map((position) => (
          <Box key={position.id}>
            <Text
              fw="bold"
              size="xl"
              w="100%"
              ta={{ base: "center", sm: "left" }}
            >
              <Balancer>{position.name}</Balancer>
            </Text>

            <Group gap="md">
              <CreateCandidate
                position={position}
                partylists={partylists}
                positions={positions}
                data-superjson
              />

              <Group
                gap="xs"
                style={{
                  overflow: "auto",
                }}
                align="center"
              >
                {!position.candidates.length ? (
                  <Text lineClamp={4}>
                    <Balancer>No candidate in {position.name} yet...</Balancer>
                  </Text>
                ) : (
                  position.candidates.map((candidate) => (
                    <Group
                      key={candidate.id}
                      className={classes["candidate-card"]}
                      gap="xs"
                    >
                      <Stack align="center" justify="center" gap="xs">
                        {candidate.image_link ? (
                          <Image
                            src={candidate.image_link}
                            width={52}
                            height={52}
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
                            size={52}
                            style={{
                              padding: 8,
                            }}
                          />
                        )}
                        <Text ta="center" w="full" lineClamp={1}>
                          {candidate.first_name}
                          {candidate.middle_name &&
                            ` ${candidate.middle_name}`}{" "}
                          {candidate.last_name}
                        </Text>
                      </Stack>

                      <Group gap="xs" align="center">
                        <EditCandidate
                          positions={positions}
                          candidate={candidate}
                          partylists={partylists}
                          data-superjson
                        />
                        <DeleteCandidate candidate={candidate} data-superjson />
                      </Group>
                    </Group>
                  ))
                )}
              </Group>
            </Group>
          </Box>
        ))
      )}
    </Stack>
  );
}
