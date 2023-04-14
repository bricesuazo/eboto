import { Text, UnstyledButton, Box, Flex } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type {
  Achievement,
  Affiliation,
  Candidate,
  Credential,
  EventAttended,
  Partylist,
  Position,
} from "@prisma/client";
import { IconUserPlus } from "@tabler/icons-react";
import CandidateCard from "./CandidateCard";
import CreateCandidateModal from "./modals/CreateCandidate";
import Balancer from "react-wrap-balancer";

const Candidates = ({
  position,
  candidates,
  partylists,
  positions,
}: {
  position: Position;
  candidates: (Candidate & {
    credential:
      | (Credential & {
          achievements: Achievement[];
          affiliations: Affiliation[];
          eventsAttended: EventAttended[];
        })
      | null;
  })[];
  partylists: Partylist[];
  positions: Position[];
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <Box>
      <CreateCandidateModal
        isOpen={opened}
        onClose={close}
        position={position}
        positions={positions}
        partylists={partylists}
      />

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
          <UnstyledButton
            onClick={open}
            sx={(theme) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              rowGap: theme.spacing.xs,
              width: 100,
              height: 140,
              textAlign: "center",
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSizes.sm,
              transition: "all 100ms ease-in-out",

              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[1],
              },

              [theme.fn.smallerThan("xs")]: {
                width: 60,
              },
            })}
          >
            <IconUserPlus />

            <Text>
              Add
              <Text
                sx={(theme) => ({
                  [theme.fn.smallerThan("xs")]: {
                    display: "none",
                  },
                })}
              >
                {" "}
                candidate
              </Text>
            </Text>
          </UnstyledButton>
        </Box>

        <Flex
          gap="xs"
          sx={{
            overflow: "auto",
          }}
          align="center"
        >
          {!candidates.length ? (
            <Text lineClamp={4}>No candidate in {position.name} yet...</Text>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                positions={positions}
                partylists={partylists}
              />
            ))
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Candidates;
