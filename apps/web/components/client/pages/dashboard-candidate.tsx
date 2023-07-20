"use client";

import {
  type Platform,
  type Candidate,
  type Achievement,
  type Affiliation,
  type EventAttended,
  type Election,
  type Position,
  type Partylist,
  type Credential,
} from "@eboto-mo/db/schema";
import {
  Anchor,
  Box,
  Button,
  Flex,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import { IconUserPlus, IconUser } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import CreateCandidate from "@/components/client/modals/create-candidate";

export default function DashboardCandidate({
  positionsWithCandidates,
  election,
  partylists,
  positions,
}: {
  positionsWithCandidates: (Position & {
    candidates: (Candidate & {
      partylist: Partylist;
      credentials: Credential[];
      platforms: Platform[];
    })[];
  })[];
  election: Election;
  partylists: Partylist[];
  positions: Position[];
}) {
  return (
    <Stack spacing="lg">
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
        positionsWithCandidates.map((position) => {
          return (
            <Candidates
              key={position.id}
              position={position}
              partylists={partylists}
              positions={positions}
            />
          );
        })
      )}
    </Stack>
  );
}

function Candidates({
  position,
  partylists,
  positions,
}: {
  position: Position & {
    candidates: (Candidate & {
      partylist: Partylist;
      credentials: Credential[];
      platforms: Platform[];
    })[];
  };
  partylists: Partylist[];
  positions: Position[];
}) {
  return (
    <Box>
      <Text
        weight="bold"
        size="xl"
        w="100%"
        sx={(theme) => ({
          [theme.fn.smallerThan("xs")]: {
            textAlign: "center",
          },
        })}
      >
        <Balancer>{position.name}</Balancer>
      </Text>

      <Flex gap={12}>
        <Box>
          <CreateCandidate
            position={position}
            partylists={partylists}
            positions={positions}
          />
        </Box>

        <Flex
          gap="xs"
          sx={{
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
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

const CandidateCard = ({
  candidate,
}: {
  candidate: Candidate & {
    partylist: Partylist;
    credentials: Credential[];
    platforms: Platform[];
  };
}) => {
  // const [
  //   openedConfirmDeleteCandidate,
  //   { open: openConfirmDeleteCandidate, close: closeConfirmDeleteCandidate },
  // ] = useDisclosure(false);
  // const [
  //   openedEditCandidate,
  //   { open: openEditCandidate, close: closeEditCandidate },
  // ] = useDisclosure(false);

  return (
    <>
      {/* <ConfirmDeleteCandidateModal
        isOpen={openedConfirmDeleteCandidate}
        onClose={closeConfirmDeleteCandidate}
        candidate={candidate}
      />
      <EditCandidateModal
        isOpen={openedEditCandidate}
        onClose={closeEditCandidate}
        partylists={partylists}
        candidate={candidate}
        positions={positions}
      /> */}

      <Box>
        <Flex
          direction="column"
          h={140}
          p={8}
          align="center"
          justify="space-between"
          sx={(theme) => ({
            width: 200,
            border: "1px solid",
            borderColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.colors.gray[3],
            borderRadius: 8,

            [theme.fn.smallerThan("xs")]: {
              width: 140,
            },
          })}
        >
          <Flex direction="column" align="center">
            {candidate.image_link ? (
              <Image
                src={candidate.image_link}
                width={52}
                height={52}
                alt={
                  candidate.first_name + " " + candidate.last_name + " image"
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
            <Text align="center" w="full" lineClamp={1}>
              {candidate.first_name} {candidate.last_name}
              {candidate.middle_name ? ` ${candidate.middle_name}` : ""}
            </Text>
          </Flex>

          <Group spacing="xs">
            <Button
              // onClick={openEditCandidate}
              variant="light"
              compact
              size="sm"
              w="fit-content"
            >
              Edit
            </Button>
            <Button
              // onClick={openConfirmDeleteCandidate}
              variant="light"
              color="red"
              compact
              size="sm"
              w="fit-content"
            >
              Delete
            </Button>
          </Group>
        </Flex>
      </Box>
    </>
  );
};
