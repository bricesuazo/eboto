"use client";

// import CandidateCard from "@/components/client/components/candidate-card";
import CreateCandidate from "@/components/client/modals/create-candidate";
import type { Candidate, Partylist, Position } from "@eboto-mo/db/schema";
import { Box, Group, Text } from "@mantine/core";
import Balancer from "react-wrap-balancer";

export default function Candidates({
  position,
  partylists,
  positions,
}: {
  position: Position & {
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
  };
  partylists: Partylist[];
  positions: Position[];
}) {
  return (
    <Box>
      <Text fw="bold" size="xl" w="100%" ta="center">
        <Balancer>{position.name}</Balancer>
      </Text>

      <Group gap="md">
        <CreateCandidate
          position={position}
          partylists={partylists}
          positions={positions}
        />

        {/* <Group
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
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                partylists={partylists}
                positions={positions}
              />
            ))
          )}
        </Group> */}
      </Group>
    </Box>
  );
}
