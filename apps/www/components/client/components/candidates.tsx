"use client";

// import CandidateCard from "@/components/client/components/candidate-card";
import CreateCandidate from "@/components/client/modals/create-candidate";
import type { Candidate, Partylist, Position } from "@eboto-mo/db/schema";
import { Box, Group, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import Image from "next/image";
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
      <Text fw="bold" size="xl" w="100%" ta={{ base: "center", sm: "left" }}>
        <Balancer>{position.name}</Balancer>
      </Text>

      <Group gap="md">
        <CreateCandidate
          position={position}
          partylists={partylists}
          positions={positions}
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
              <Box>
                <Group
                  h={140}
                  p={8}
                  align="center"
                  justify="space-between"
                  style={() => ({
                    width: 200,
                    border: "1px solid",
                    // borderColor:
                    //   theme.colorScheme === "dark"
                    //     ? theme.colors.dark[5]
                    //     : theme.colors.gray[3],
                    borderRadius: 8,
                  })}
                >
                  <Group align="center">
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
                  </Group>

                  {/* <Group gap="xs">
                    <EditCandidate
                      positions={positions}
                      candidate={candidate}
                      partylists={partylists}
                    />
                    <DeleteCandidate candidate={candidate} />
                  </Group> */}
                </Group>
              </Box>
            ))
          )}
        </Group>
      </Group>
    </Box>
  );
}
