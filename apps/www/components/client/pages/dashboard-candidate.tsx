"use client";

import Candidates from "@/components/client/components/candidates";
import type {
  Candidate,
  Election,
  Partylist,
  Position,
} from "@eboto-mo/db/schema";
import { Anchor, Box, Stack, Text } from "@mantine/core";
import Link from "next/link";

export default function DashboardCandidate({
  positionsWithCandidates,
  election,
  partylists,
  positions,
}: {
  positionsWithCandidates: (Position & {
    candidates: (Candidate & {
      credential: {
        id: string;
        affiliations: {
          id: string;
          org_name: string;
          org_position: string;
          start_year: Date;
          end_year: Date;
        }[];
        achievements: {
          id: string;
          name: string;
          year: Date;
        }[];
        events_attended: {
          id: string;
          name: string;
          year: Date;
        }[];
      } | null;
      platforms: {
        id: string;
        title: string;
        description: string;
      }[];
    })[];
  })[];
  election: Election;
  partylists: Partylist[];
  positions: Position[];
}) {
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
